// @refresh reset
import Phaser from "phaser";
import { useEffect, useRef } from "react";

const MAP_BASE_PATH = "/assets/map";
const MAP_PATH = `${MAP_BASE_PATH}/mongle.tmj`;
const CHIEF_HOUSE_KEY = "chief-house";
const CHIEF_HOUSE_PATH = "/assets/objects/chief_house.png";
const MAX_ZOOM_MULTIPLIER = 1.5;
const KEYBOARD_PAN_SPEED = 210;
const BUTTON_PAN_DISTANCE = 86;
const WHEEL_ZOOM_STEP = 0.12;
const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const TILE_FLIP_MASK =
  FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG;

type ResidentPreview = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type PhaserVillageProps = {
  residents: ResidentPreview[];
  reloadKey: number;
  onOpenDialogue: () => void;
};

type MapControlCommand = "down" | "left" | "right" | "up" | "zoom-in" | "zoom-out";

type TiledLayer = {
  data: number[];
  height: number;
  name: string;
  opacity?: number;
  type: string;
  visible: boolean;
  width: number;
  x?: number;
  y?: number;
};

type TiledMap = {
  height: number;
  layers: TiledLayer[];
  tileheight: number;
  tilesets: Array<{
    firstgid: number;
    source: string;
  }>;
  tilewidth: number;
  width: number;
};

type TilesetMeta = {
  columns: number;
  firstgid: number;
  imageHeight: number;
  imageUrl: string;
  imageWidth: number;
  name: string;
  source: string;
  tilecount: number;
  tileHeight: number;
  tileWidth: number;
};

function encodeAssetPath(fileName: string) {
  return `${MAP_BASE_PATH}/${fileName.split("/").map(encodeURIComponent).join("/")}`;
}

function basename(path: string) {
  return path.split("/").pop() ?? path;
}

function decodeGid(gid: number) {
  return gid & ~TILE_FLIP_MASK;
}

function findTileset(gid: number, tilesets: TilesetMeta[]) {
  let match: TilesetMeta | null = null;
  for (const tileset of tilesets) {
    if (gid >= tileset.firstgid) {
      match = tileset;
    }
  }
  return match;
}

function readRequiredAttribute(element: Element, name: string) {
  const value = element.getAttribute(name);
  if (!value) {
    throw new Error(`Tileset attribute is missing: ${name}`);
  }
  return value;
}

async function fetchText(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} (${response.status})`);
  }
  return response.text();
}

async function loadTilesetMeta(source: string, firstgid: number): Promise<TilesetMeta> {
  const xmlText = await fetchText(encodeAssetPath(source));
  const document = new DOMParser().parseFromString(xmlText, "application/xml");
  const tileset = document.querySelector("tileset");
  const image = document.querySelector("image");
  if (!tileset || !image) {
    throw new Error(`${source} is not a valid Tiled tileset`);
  }

  const imageFile = basename(readRequiredAttribute(image, "source"));
  return {
    columns: Number(readRequiredAttribute(tileset, "columns")),
    firstgid,
    imageHeight: Number(readRequiredAttribute(image, "height")),
    imageUrl: encodeAssetPath(imageFile),
    imageWidth: Number(readRequiredAttribute(image, "width")),
    name: readRequiredAttribute(tileset, "name"),
    source,
    tilecount: Number(readRequiredAttribute(tileset, "tilecount")),
    tileHeight: Number(readRequiredAttribute(tileset, "tileheight")),
    tileWidth: Number(readRequiredAttribute(tileset, "tilewidth")),
  };
}

class VillageScene extends Phaser.Scene {
  private readonly isDisposed: () => boolean;
  private readonly onOpenDialogue: () => void;
  private baseZoom = 1;
  private cameraCenter = new Phaser.Math.Vector2(0, 0);
  private cleanupCameraControls: Array<() => void> = [];
  private dragStart: { pointerX: number; pointerY: number } | null = null;
  private hasDragged = false;
  private pressedPanKeys = new Set<"down" | "left" | "right" | "up">();
  private mapBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private missingAssets: string[] = [];

  constructor(sceneKey: string, onOpenDialogue: () => void, isDisposed: () => boolean) {
    super(sceneKey);
    this.isDisposed = isDisposed;
    this.onOpenDialogue = onOpenDialogue;
  }

  create() {
    this.cameras.main.setBackgroundColor("#47783d");
    void this.buildVillage();
  }

  update(_time: number, delta: number) {
    this.panWithKeyboard(delta);
  }

  private async buildVillage() {
    try {
      const map = (await fetch(MAP_PATH).then((response) => {
        if (!response.ok) {
          throw new Error(`${MAP_PATH} (${response.status})`);
        }
        return response.json();
      })) as TiledMap;

      const tilesets = await this.loadTilesets(map);
      if (this.isDisposed()) {
        return;
      }
      await this.loadSpritesheets(tilesets);
      if (this.isDisposed()) {
        return;
      }
      this.renderTileLayers(map, tilesets);
      this.addVillageActors(map);
      this.fitCamera(map);
      this.scale.on(Phaser.Scale.Events.RESIZE, () => this.fitCamera(map));
      this.configureCameraControls();
      if (this.missingAssets.length > 0) {
        console.warn("Mongle map loaded with missing assets", this.missingAssets);
      }
    } catch (error) {
      console.error("Mongle map failed to load", error);
    }
  }

  private async loadTilesets(map: TiledMap) {
    const tilesets: TilesetMeta[] = [];
    for (const tileset of map.tilesets) {
      try {
        tilesets.push(await loadTilesetMeta(tileset.source, tileset.firstgid));
      } catch (error) {
        this.missingAssets.push(
          `${tileset.source}: ${error instanceof Error ? error.message : "load failed"}`,
        );
      }
    }
    return tilesets.sort((a, b) => a.firstgid - b.firstgid);
  }

  private loadSpritesheets(tilesets: TilesetMeta[]) {
    return new Promise<void>((resolve) => {
      for (const tileset of tilesets) {
        if (this.isDisposed()) {
          resolve();
          return;
        }
        if (this.textures.exists(tileset.name)) {
          continue;
        }
        this.load.spritesheet(tileset.name, tileset.imageUrl, {
          frameHeight: tileset.tileHeight,
          frameWidth: tileset.tileWidth,
        });
      }
      if (!this.textures.exists(CHIEF_HOUSE_KEY)) {
        this.load.image(CHIEF_HOUSE_KEY, CHIEF_HOUSE_PATH);
      }

      this.load.once(Phaser.Loader.Events.COMPLETE, resolve);
      this.load.start();
    });
  }

  private renderTileLayers(map: TiledMap, tilesets: TilesetMeta[]) {
    const mapPixelWidth = map.width * map.tilewidth;
    const mapPixelHeight = map.height * map.tileheight;

    map.layers
      .filter((layer) => layer.type === "tilelayer" && layer.visible)
      .forEach((layer, layerIndex) => {
        const renderTexture = this.add
          .renderTexture(
            (layer.x ?? 0) * map.tilewidth,
            (layer.y ?? 0) * map.tileheight,
            mapPixelWidth,
            mapPixelHeight,
          )
          .setOrigin(0)
          .setAlpha(layer.opacity ?? 1)
          .setDepth(layerIndex);

        layer.data.forEach((rawGid, index) => {
          const gid = decodeGid(rawGid);
          if (gid === 0) {
            return;
          }

          const tileset = findTileset(gid, tilesets);
          if (!tileset || gid >= tileset.firstgid + tileset.tilecount) {
            return;
          }

          const x = (index % layer.width) * map.tilewidth;
          const y = Math.floor(index / layer.width) * map.tileheight;
          const frame = gid - tileset.firstgid;
          if (this.textures.getFrame(tileset.name, frame) !== null) {
            renderTexture.drawFrame(tileset.name, frame, x, y);
          }
        });
      });
  }

  private addVillageActors(map: TiledMap) {
    const centerX = (map.width * map.tilewidth) / 2;
    const centerY = (map.height * map.tileheight) / 2;
    const chiefHouse = this.add
      .image(centerX, centerY + 4, CHIEF_HOUSE_KEY)
      .setOrigin(0.5, 0.86)
      .setDisplaySize(102, 93)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });

    chiefHouse.on("pointerup", () => {
      if (!this.hasDragged) {
        this.onOpenDialogue();
      }
    });
  }

  private fitCamera(map: TiledMap) {
    const mapPixelWidth = map.width * map.tilewidth;
    const mapPixelHeight = map.height * map.tileheight;
    const viewportWidth = this.scale.width;
    const viewportHeight = this.scale.height;
    const previousZoomMultiplier = this.baseZoom > 0 ? this.cameras.main.zoom / this.baseZoom : 1;
    this.baseZoom = Math.max(viewportWidth / mapPixelWidth, viewportHeight / mapPixelHeight);
    const zoom = Phaser.Math.Clamp(
      this.baseZoom * previousZoomMultiplier,
      this.baseZoom,
      this.baseZoom * MAX_ZOOM_MULTIPLIER,
    );

    this.mapBounds.setTo(0, 0, mapPixelWidth, mapPixelHeight);
    if (this.cameraCenter.equals(Phaser.Math.Vector2.ZERO)) {
      this.cameraCenter.set(mapPixelWidth / 2, mapPixelHeight / 2);
    }
    this.cameras.main.setZoom(zoom);
    this.applyCameraView();
  }

  private configureCameraControls() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyCameraControls());

    const handleMapControl = (event: Event) => {
      const command = (event as CustomEvent<MapControlCommand>).detail;
      this.handleMapControl(command);
    };
    window.addEventListener("mongle-map-control", handleMapControl);
    this.cleanupCameraControls.push(() =>
      window.removeEventListener("mongle-map-control", handleMapControl),
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = this.getPanDirectionForKey(event.key);
      if (!direction) {
        return;
      }
      event.preventDefault();
      this.pressedPanKeys.add(direction);
      this.handleMapControl(direction);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const direction = this.getPanDirectionForKey(event.key);
      if (!direction) {
        return;
      }
      event.preventDefault();
      this.pressedPanKeys.delete(direction);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    this.cleanupCameraControls.push(
      () => window.removeEventListener("keydown", handleKeyDown),
      () => window.removeEventListener("keyup", handleKeyUp),
    );

    this.updateCameraCursor();

    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
        _deltaZ: number,
        event?: WheelEvent,
      ) => {
        event?.preventDefault();
        this.zoomAtPoint(deltaY, pointer.x, pointer.y);
      },
    );

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown() || this.cameras.main.zoom <= this.baseZoom) {
        return;
      }

      this.dragStart = {
        pointerX: pointer.x,
        pointerY: pointer.y,
      };
      this.hasDragged = false;
      this.input.setDefaultCursor("grabbing");
    });

    this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (!this.dragStart || !pointer.leftButtonDown()) {
        return;
      }

      const deltaX = pointer.x - this.dragStart.pointerX;
      const deltaY = pointer.y - this.dragStart.pointerY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        this.hasDragged = true;
      }

      this.panByScreenDelta(deltaX, deltaY);
      this.dragStart = {
        pointerX: pointer.x,
        pointerY: pointer.y,
      };
    });

    this.input.on(Phaser.Input.Events.POINTER_UP, () => {
      this.dragStart = null;
      this.updateCameraCursor();
    });

    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, () => {
      this.dragStart = null;
      this.updateCameraCursor();
    });
  }

  private zoomFromViewportCenter(deltaY: number) {
    this.zoomAtPoint(deltaY, this.cameras.main.width / 2, this.cameras.main.height / 2);
  }

  private handleMapControl(command: MapControlCommand) {
    if (command === "zoom-in") {
      this.zoomFromViewportCenter(-1);
      return;
    }
    if (command === "zoom-out") {
      this.zoomFromViewportCenter(1);
      return;
    }

    const camera = this.cameras.main;
    const distance = BUTTON_PAN_DISTANCE / camera.zoom;
    if (command === "left") {
      this.cameraCenter.x -= distance;
    }
    if (command === "right") {
      this.cameraCenter.x += distance;
    }
    if (command === "up") {
      this.cameraCenter.y -= distance;
    }
    if (command === "down") {
      this.cameraCenter.y += distance;
    }
    this.applyCameraView();
  }

  private applyCameraView() {
    const camera = this.cameras.main;
    const visibleWidth = camera.width / camera.zoom;
    const visibleHeight = camera.height / camera.zoom;
    const requestedScrollX = this.cameraCenter.x - visibleWidth / 2;
    const requestedScrollY = this.cameraCenter.y - visibleHeight / 2;
    const maxScrollX = this.mapBounds.width - visibleWidth;
    const maxScrollY = this.mapBounds.height - visibleHeight;

    camera.scrollX =
      maxScrollX <= 0 ? maxScrollX / 2 : Phaser.Math.Clamp(requestedScrollX, 0, maxScrollX);
    camera.scrollY =
      maxScrollY <= 0 ? maxScrollY / 2 : Phaser.Math.Clamp(requestedScrollY, 0, maxScrollY);
    this.cameraCenter.set(camera.scrollX + visibleWidth / 2, camera.scrollY + visibleHeight / 2);
    camera.centerOn(this.cameraCenter.x, this.cameraCenter.y);
  }

  private updateCameraCursor() {
    this.input.setDefaultCursor(this.cameras.main.zoom > this.baseZoom ? "grab" : "default");
  }

  private destroyCameraControls() {
    for (const cleanup of this.cleanupCameraControls) {
      cleanup();
    }
    this.cleanupCameraControls = [];
    this.pressedPanKeys.clear();
  }

  private zoomAtPoint(deltaY: number, screenX: number, screenY: number) {
    const camera = this.cameras.main;
    const oldZoom = camera.zoom;
    const nextZoom = Phaser.Math.Clamp(
      oldZoom * (deltaY > 0 ? 1 - WHEEL_ZOOM_STEP : 1 + WHEEL_ZOOM_STEP),
      this.baseZoom,
      this.baseZoom * MAX_ZOOM_MULTIPLIER,
    );

    if (nextZoom === oldZoom) {
      return;
    }

    const before = new Phaser.Math.Vector2(
      camera.scrollX + screenX / oldZoom,
      camera.scrollY + screenY / oldZoom,
    );
    camera.setZoom(nextZoom);
    this.cameraCenter.x = before.x + (camera.width / 2 - screenX) / nextZoom;
    this.cameraCenter.y = before.y + (camera.height / 2 - screenY) / nextZoom;
    this.applyCameraView();
    this.updateCameraCursor();
  }

  private panByScreenDelta(deltaX: number, deltaY: number) {
    const camera = this.cameras.main;
    this.cameraCenter.x -= deltaX / camera.zoom;
    this.cameraCenter.y -= deltaY / camera.zoom;
    this.applyCameraView();
    this.updateCameraCursor();
  }

  private panWithKeyboard(delta: number) {
    if (this.cameras.main.zoom <= this.baseZoom) {
      return;
    }

    const camera = this.cameras.main;
    const distance = (KEYBOARD_PAN_SPEED * delta) / 1000 / camera.zoom;
    const left = this.pressedPanKeys.has("left");
    const right = this.pressedPanKeys.has("right");
    const up = this.pressedPanKeys.has("up");
    const down = this.pressedPanKeys.has("down");

    if (left) {
      this.cameraCenter.x -= distance;
    }
    if (right) {
      this.cameraCenter.x += distance;
    }
    if (up) {
      this.cameraCenter.y -= distance;
    }
    if (down) {
      this.cameraCenter.y += distance;
    }
    if (left || right || up || down) {
      this.applyCameraView();
    }
  }

  private getPanDirectionForKey(key: string) {
    const normalized = key.toLowerCase();
    if (normalized === "arrowleft" || normalized === "a") {
      return "left";
    }
    if (normalized === "arrowright" || normalized === "d") {
      return "right";
    }
    if (normalized === "arrowup" || normalized === "w") {
      return "up";
    }
    if (normalized === "arrowdown" || normalized === "s") {
      return "down";
    }
    return null;
  }
}

export function PhaserVillage({ reloadKey, onOpenDialogue }: PhaserVillageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  function dispatchMapControl(command: MapControlCommand) {
    window.dispatchEvent(
      new CustomEvent<MapControlCommand>("mongle-map-control", { detail: command }),
    );
  }

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    let disposed = false;
    const game = new Phaser.Game({
      backgroundColor: "#47783d",
      parent: containerRef.current,
      pixelArt: true,
      render: {
        antialias: false,
        pixelArt: true,
      },
      scale: {
        height: containerRef.current.clientHeight,
        mode: Phaser.Scale.RESIZE,
        width: containerRef.current.clientWidth,
      },
      scene: new VillageScene(`VillageScene-${reloadKey}`, onOpenDialogue, () => disposed),
      type: Phaser.AUTO,
    });

    return () => {
      disposed = true;
      game.destroy(true);
    };
  }, [reloadKey, onOpenDialogue]);

  return (
    <>
      <div
        ref={containerRef}
        className="phaserLayer"
        role="img"
        aria-label="몽글마을 Phaser 배경"
      />
      <fieldset className="mapControls" aria-label="지도 조작">
        <button type="button" onClick={() => dispatchMapControl("zoom-in")} aria-label="지도 확대">
          +
        </button>
        <button type="button" onClick={() => dispatchMapControl("up")} aria-label="위로 이동">
          ↑
        </button>
        <button type="button" onClick={() => dispatchMapControl("zoom-out")} aria-label="지도 축소">
          −
        </button>
        <button type="button" onClick={() => dispatchMapControl("left")} aria-label="왼쪽으로 이동">
          ←
        </button>
        <button type="button" onClick={() => dispatchMapControl("down")} aria-label="아래로 이동">
          ↓
        </button>
        <button
          type="button"
          onClick={() => dispatchMapControl("right")}
          aria-label="오른쪽으로 이동"
        >
          →
        </button>
      </fieldset>
    </>
  );
}
