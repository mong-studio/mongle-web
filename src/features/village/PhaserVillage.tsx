// @refresh reset
import Phaser from "phaser";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { FullScreenLoader } from "../../shared/ui/FullScreenLoader.js";
import "./PhaserVillage.css";

const MAP_BASE_PATH = "/assets/map";
const MAP_PATH = `${MAP_BASE_PATH}/mongle.tmj`;
const BOARD_KEY = "village-board";
const BOARD_PATH = "/assets/objects/board.png";
const CHIEF_HOUSE_KEY = "chief-house";
const CHIEF_HOUSE_PATH = "/assets/objects/chief_house.png";
const RESIDENT_HOUSE_COLORS = ["blue", "green", "purple", "yellow"] as const;
const RESIDENT_HOUSE_DISPLAY_WIDTH = 84;
const RESIDENT_HOUSE_DISPLAY_HEIGHT = 76;
const CHIEF_NPC_KEY = "chief-npc";
const CHIEF_NPC_PATH = "/assets/mongle_chief.png";
const CHIEF_NPC_SPEED = 10;
const CHIEF_NPC_DISPLAY_SIZE = 50;
const CHIEF_NPC_BOB_AMPLITUDE = 2;
const CHIEF_NPC_BOB_FREQUENCY = 0.01;
const CHIEF_NPC_TARGET_RADIUS = 5;
const CHIEF_NPC_TARGET_RETRIES = 60;
const CHIEF_NPC_STEERING = 0.055;
const CHIEF_NPC_MIN_WANDER_DISTANCE = 72;
const CHIEF_NPC_MAX_WANDER_DISTANCE = 180;
const DECORATION_LAYER_NAME = "타일 레이어 4";
const BASIC_GRASS_OBJECTS_SOURCE = "Basic Grass Biom things 1.tsx";
const BLOCKING_OBJECT_FRAMES = new Set([0, 1, 2, 6, 7, 8, 14, 15, 16, 25, 27, 28, 31, 32, 33]);
const MAX_ZOOM_MULTIPLIER = 1.5;
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

type ResidentNpcState = {
  npc: Phaser.GameObjects.Image;
  target: Phaser.Math.Vector2 | null;
  velocity: Phaser.Math.Vector2;
  worldPosition: Phaser.Math.Vector2;
  waitUntil: number;
};

type PhaserVillageProps = {
  residents: ResidentPreview[];
  reloadKey: number;
  onOpenBoard: () => void;
  onOpenDialogue: () => void;
};

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

type MinimapState = {
  imageUrl?: string;
  mapHeight: number;
  mapWidth: number;
  markers: MinimapMarker[];
  viewportHeight: number;
  viewportWidth: number;
  viewportX: number;
  viewportY: number;
};

type MinimapMarker = {
  id: string;
  label: string;
  type: "chief" | "house" | "resident";
  x: number;
  y: number;
};

type ObjectHintState = {
  label: string;
  visible: boolean;
  x: number;
  y: number;
};

type ActiveObjectHint = {
  label: string;
  worldX: number;
  worldY: number;
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
  private readonly onOpenBoard: () => void;
  private readonly onOpenDialogue: () => void;
  private readonly residents: ResidentPreview[];
  private baseZoom = 1;
  private cameraCenter = new Phaser.Math.Vector2(0, 0);
  private cleanupCameraControls: Array<() => void> = [];
  private dragStart: { pointerX: number; pointerY: number } | null = null;
  private hasDragged = false;
  private activeObjectHint: ActiveObjectHint | null = null;
  private blockedWorldRects: Phaser.Geom.Rectangle[] = [];
  private chiefNpc: Phaser.GameObjects.Image | null = null;
  private chiefTarget: Phaser.Math.Vector2 | null = null;
  private chiefVelocity = new Phaser.Math.Vector2(0, 0);
  private chiefWorldPosition = new Phaser.Math.Vector2(0, 0);
  private chiefWaitUntil = 0;
  private residentNpcStates: ResidentNpcState[] = [];
  private hoveredResidentNpc: { state: ResidentNpcState; label: string } | null = null;
  private lastObjectHintSignature = "";
  private lastMinimapSignature = "";
  private mapBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private minimapImageUrl = "";
  private minimapMarkers: MinimapMarker[] = [];
  private missingAssets: string[] = [];

  constructor(
    sceneKey: string,
    onOpenDialogue: () => void,
    onOpenBoard: () => void,
    isDisposed: () => boolean,
    residents: ResidentPreview[],
  ) {
    super(sceneKey);
    this.isDisposed = isDisposed;
    this.onOpenBoard = onOpenBoard;
    this.onOpenDialogue = onOpenDialogue;
    this.residents = residents;
  }

  create() {
    this.cameras.main.setBackgroundColor("#47783d");
    void this.buildVillage();
  }

  update(time: number, delta: number) {
    this.updateChiefNpc(time, delta);
    this.updateResidentNpcs(time, delta);
    this.publishMinimapStateIfChanged();
    this.publishActiveObjectHint();
    this.publishHoveredResidentHint();
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
      this.mapBounds.setTo(0, 0, map.width * map.tilewidth, map.height * map.tileheight);
      this.blockedWorldRects = [];
      this.addDecorationCollisionRects(map, tilesets);
      await this.loadResidentTextures();
      if (this.isDisposed()) {
        return;
      }
      this.addVillageActors(map);
      await this.createMinimapSnapshot(map, tilesets);
      if (this.isDisposed()) {
        return;
      }
      this.fitCamera(map);
      this.scale.on(Phaser.Scale.Events.RESIZE, () => this.fitCamera(map));
      this.configureCameraControls();
      if (this.missingAssets.length > 0) {
        console.warn("Mongle map loaded with missing assets", this.missingAssets);
      }
      this.signalReady();
    } catch (error) {
      console.error("Mongle map failed to load", error);
      this.signalReady(); // 실패해도 로딩 화면이 영원히 남지 않게 한다
    }
  }

  // 맵 배치(fitCamera)까지 끝난 뒤 React에 알려 전체 화면 로딩을 해제한다.
  private signalReady() {
    if (this.isDisposed()) {
      return;
    }
    window.dispatchEvent(new CustomEvent("mongle-village-ready"));
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

  private async loadResidentTextures(): Promise<void> {
    await Promise.all(
      this.residents
        .filter((r) => r.avatarUrl)
        .map(async (resident) => {
          const key = `resident-npc-${resident.id}`;
          if (this.textures.exists(key)) {
            return;
          }
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
              img.src = resident.avatarUrl ?? "";
            });
            if (!this.textures.exists(key)) {
              this.textures.addImage(key, img);
            }
          } catch {
            // 로드 실패 시 폴백 이미지 사용
          }
        }),
    );
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
      if (!this.textures.exists(CHIEF_NPC_KEY)) {
        this.load.image(CHIEF_NPC_KEY, CHIEF_NPC_PATH);
      }
      if (!this.textures.exists(BOARD_KEY)) {
        this.load.image(BOARD_KEY, BOARD_PATH);
      }
      for (const color of RESIDENT_HOUSE_COLORS) {
        const key = `resident-house-${color}`;
        if (!this.textures.exists(key)) {
          this.load.image(key, `/assets/objects/house_${color}.png`);
        }
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

  private addDecorationCollisionRects(map: TiledMap, tilesets: TilesetMeta[]) {
    const decorationLayer = map.layers.find(
      (layer) =>
        layer.type === "tilelayer" && layer.visible && layer.name === DECORATION_LAYER_NAME,
    );
    if (!decorationLayer) {
      return;
    }

    decorationLayer.data.forEach((rawGid, index) => {
      const gid = decodeGid(rawGid);
      if (gid === 0) {
        return;
      }

      const tileset = findTileset(gid, tilesets);
      if (!tileset || tileset.source !== BASIC_GRASS_OBJECTS_SOURCE) {
        return;
      }

      const frame = gid - tileset.firstgid;
      if (!BLOCKING_OBJECT_FRAMES.has(frame)) {
        return;
      }

      const x = (index % decorationLayer.width) * map.tilewidth;
      const y = Math.floor(index / decorationLayer.width) * map.tileheight;
      this.blockedWorldRects.push(
        new Phaser.Geom.Rectangle(x - 8, y - 8, map.tilewidth + 16, map.tileheight + 18),
      );
    });
  }

  private addVillageActors(map: TiledMap) {
    const centerX = (map.width * map.tilewidth) / 2;
    const centerY = (map.height * map.tileheight) / 2;
    this.blockedWorldRects.push(
      new Phaser.Geom.Rectangle(centerX - 66, centerY - 72, 132, 112),
      new Phaser.Geom.Rectangle(centerX - 74, centerY - 2, 70, 60),
    );
    const chiefHouse = this.add
      .image(centerX, centerY + 4, CHIEF_HOUSE_KEY)
      .setOrigin(0.5, 0.86)
      .setDisplaySize(102, 93)
      .setDepth(centerY + 4)
      .setInteractive({ useHandCursor: true });
    this.addClickableObjectHover(chiefHouse, {
      label: "이장님과 대화",
      worldX: centerX,
      worldY: centerY - 78,
    });

    chiefHouse.on("pointerup", () => {
      if (!this.hasDragged) {
        this.onOpenDialogue();
      }
    });

    const boardX = centerX - 40;
    const boardY = centerY + 33;
    const board = this.add
      .image(boardX, boardY, BOARD_KEY)
      .setOrigin(0.5, 0.86)
      .setDisplaySize(58, 58)
      .setDepth(boardY + 6)
      .setInteractive({ useHandCursor: true });
    this.addClickableObjectHover(
      board,
      {
        label: "일정 확인",
        worldX: boardX,
        worldY: boardY - 52,
      },
      1.1,
    );

    board.on("pointerup", () => {
      if (!this.hasDragged) {
        this.onOpenBoard();
      }
    });

    this.addWanderingChief(map, centerX, centerY);

    const residentOffsets = [
      [-220, -126],
      [190, -108],
      [-314, 124],
      [266, 146],
      [-54, 218],
      [78, -236],
      [-390, -14],
      [358, -36],
      [-140, 300],
      [230, 280],
    ];

    const residentHouseMarkers: MinimapMarker[] = [];
    this.residents.slice(0, residentOffsets.length).forEach((resident, index) => {
      const [offsetX, offsetY] = residentOffsets[index];
      // 집 크기(84×76)와 origin(0.5, 0.86)을 고려해 맵 안쪽에 여백을 둔다.
      const houseHalfW = RESIDENT_HOUSE_DISPLAY_WIDTH / 2 + 16;
      const houseTopH = Math.ceil(RESIDENT_HOUSE_DISPLAY_HEIGHT * 0.86) + 16;
      const houseBotH = Math.ceil(RESIDENT_HOUSE_DISPLAY_HEIGHT * 0.14) + 16;
      const hx = Phaser.Math.Clamp(
        centerX + offsetX,
        houseHalfW,
        map.width * map.tilewidth - houseHalfW,
      );
      const hy = Phaser.Math.Clamp(
        centerY + offsetY,
        houseTopH,
        map.height * map.tileheight - houseBotH,
      );
      const color = RESIDENT_HOUSE_COLORS[index % RESIDENT_HOUSE_COLORS.length];
      const houseKey = `resident-house-${color}`;

      this.blockedWorldRects.push(
        new Phaser.Geom.Rectangle(
          hx - RESIDENT_HOUSE_DISPLAY_WIDTH / 2 - 8,
          hy - RESIDENT_HOUSE_DISPLAY_HEIGHT * 0.86 - 8,
          RESIDENT_HOUSE_DISPLAY_WIDTH + 16,
          RESIDENT_HOUSE_DISPLAY_HEIGHT + 8,
        ),
      );

      const houseHint: ActiveObjectHint = {
        label: `${resident.name}의 집`,
        worldX: hx,
        worldY: hy - RESIDENT_HOUSE_DISPLAY_HEIGHT * 0.86 - 6,
      };
      const houseObj = this.add
        .image(hx, hy, houseKey)
        .setOrigin(0.5, 0.86)
        .setDisplaySize(RESIDENT_HOUSE_DISPLAY_WIDTH, RESIDENT_HOUSE_DISPLAY_HEIGHT)
        .setDepth(hy)
        .setInteractive();

      houseObj.on("pointerover", () => {
        this.activeObjectHint = houseHint;
        this.publishObjectHint({ ...houseHint, visible: true });
      });
      houseObj.on("pointerout", () => {
        if (this.activeObjectHint === houseHint) {
          this.activeObjectHint = null;
          this.lastObjectHintSignature = "";
          this.publishObjectHint({ ...houseHint, visible: false });
        }
      });

      {
        const residentNpcKey = `resident-npc-${resident.id}`;
        if (this.textures.exists(residentNpcKey)) {
          const spawnX = hx + Phaser.Math.Between(-16, 16);
          const spawnY = hy + Phaser.Math.Between(12, 28);
          const npc = this.add
            .image(spawnX, spawnY, residentNpcKey)
            .setOrigin(0.5, 0.86)
            .setDisplaySize(44, 44)
            .setDepth(spawnY)
            .setInteractive();
          const npcState: ResidentNpcState = {
            npc,
            target: null,
            velocity: new Phaser.Math.Vector2(0, 0),
            worldPosition: new Phaser.Math.Vector2(spawnX, spawnY),
            waitUntil: Phaser.Math.Between(0, 3000),
          };
          this.residentNpcStates.push(npcState);
          npc.on("pointerover", () => {
            this.hoveredResidentNpc = { state: npcState, label: resident.name };
          });
          npc.on("pointerout", () => {
            if (this.hoveredResidentNpc?.state === npcState) {
              this.hoveredResidentNpc = null;
              this.publishObjectHint({
                label: resident.name,
                visible: false,
                worldX: npcState.worldPosition.x,
                worldY: npcState.worldPosition.y,
              });
            }
          });
        }
      }

      residentHouseMarkers.push({
        id: resident.id,
        label: resident.name,
        type: "resident",
        x: hx,
        y: hy,
      });
    });

    this.minimapMarkers = [
      {
        id: "chief-house",
        label: "이장님 집",
        type: "house",
        x: centerX,
        y: centerY,
      },
      {
        id: "chief-npc",
        label: "이장님",
        type: "chief",
        x: this.chiefNpc?.x ?? centerX + 92,
        y: this.chiefNpc?.y ?? centerY + 52,
      },
      ...residentHouseMarkers,
    ];
  }

  private addWanderingChief(map: TiledMap, centerX: number, centerY: number) {
    const spawnX = centerX + 92;
    const spawnY = centerY + 52;
    this.chiefWorldPosition.set(spawnX, spawnY);
    this.chiefNpc = this.add
      .image(spawnX, spawnY, CHIEF_NPC_KEY)
      .setOrigin(0.5, 0.86)
      .setDisplaySize(CHIEF_NPC_DISPLAY_SIZE, CHIEF_NPC_DISPLAY_SIZE)
      .setDepth(spawnY)
      .setInteractive({ useHandCursor: true });

    this.chiefNpc.on("pointerup", () => {
      if (!this.hasDragged) {
        this.onOpenDialogue();
      }
    });

    this.chiefNpc.on("pointerover", () => {
      this.chiefNpc?.setTint(0xfff0b0);
    });
    this.chiefNpc.on("pointerout", () => {
      this.chiefNpc?.clearTint();
    });

    this.chooseChiefTarget(map.width * map.tilewidth, map.height * map.tileheight, 0);
  }

  private updateChiefNpc(time: number, delta: number) {
    if (!this.chiefNpc || this.mapBounds.width <= 0 || this.mapBounds.height <= 0) {
      return;
    }

    if (!this.chiefTarget && time < this.chiefWaitUntil) {
      this.updateChiefMinimapMarker();
      return;
    }

    if (
      !this.chiefTarget ||
      this.isWorldPointCoveredByHud(this.chiefWorldPosition.x, this.chiefWorldPosition.y)
    ) {
      this.chooseChiefTargetFromCurrent(time);
    }

    if (!this.chiefTarget) {
      this.updateChiefMinimapMarker();
      return;
    }

    const dx = this.chiefTarget.x - this.chiefWorldPosition.x;
    const dy = this.chiefTarget.y - this.chiefWorldPosition.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= CHIEF_NPC_TARGET_RADIUS) {
      this.chiefTarget = null;
      this.chiefVelocity.scale(0.72);
      this.chiefWaitUntil = time + Phaser.Math.Between(900, 2200);
      this.applyChiefDisplayMotion(time, 0, 0, false);
      this.updateChiefMinimapMarker();
      return;
    }

    const desiredVelocity = new Phaser.Math.Vector2(dx / distance, dy / distance).scale(
      CHIEF_NPC_SPEED,
    );
    this.chiefVelocity.lerp(desiredVelocity, Math.min(1, CHIEF_NPC_STEERING * (delta / 16.67)));

    const nextX = this.chiefWorldPosition.x + (this.chiefVelocity.x * delta) / 1000;
    const nextY = this.chiefWorldPosition.y + (this.chiefVelocity.y * delta) / 1000;
    if (this.isChiefPointBlocked(nextX, nextY)) {
      this.chiefTarget = null;
      this.chiefVelocity.set(0, 0);
      this.chiefWaitUntil = time + 500;
      this.applyChiefDisplayMotion(time, 0, 0, false);
      this.updateChiefMinimapMarker();
      return;
    }

    this.chiefWorldPosition.set(nextX, nextY);
    this.applyChiefDisplayMotion(time, this.chiefVelocity.x, this.chiefVelocity.y, true);
    this.updateChiefMinimapMarker();
  }

  private applyChiefDisplayMotion(time: number, dx: number, dy: number, moving: boolean) {
    if (!this.chiefNpc) {
      return;
    }

    const bobPhase = Math.sin(time * CHIEF_NPC_BOB_FREQUENCY);
    const bob = moving ? Math.max(0, bobPhase) : 0;
    const yOffset = -bob * CHIEF_NPC_BOB_AMPLITUDE;

    this.chiefNpc.setPosition(this.chiefWorldPosition.x, this.chiefWorldPosition.y + yOffset);
    this.chiefNpc.setDepth(this.chiefWorldPosition.y);
    this.chiefNpc.setDisplaySize(CHIEF_NPC_DISPLAY_SIZE, CHIEF_NPC_DISPLAY_SIZE);
    this.chiefNpc.setAngle(0);

    if (moving && Math.abs(dx) > Math.abs(dy) * 0.25) {
      this.chiefNpc.setFlipX(dx < 0);
    }
  }

  private chooseChiefTargetFromCurrent(time: number) {
    this.chooseChiefTarget(this.mapBounds.width, this.mapBounds.height, time);
  }

  private chooseChiefTarget(mapPixelWidth: number, mapPixelHeight: number, time: number) {
    if (!this.chiefNpc) {
      return;
    }

    const margin = 56;
    const fromX = this.chiefWorldPosition.x;
    const fromY = this.chiefWorldPosition.y;

    for (let attempt = 0; attempt < CHIEF_NPC_TARGET_RETRIES; attempt += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(
        CHIEF_NPC_MIN_WANDER_DISTANCE,
        CHIEF_NPC_MAX_WANDER_DISTANCE,
      );
      const target = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(fromX + Math.cos(angle) * distance, margin, mapPixelWidth - margin),
        Phaser.Math.Clamp(fromY + Math.sin(angle) * distance, margin, mapPixelHeight - margin),
      );
      if (
        !this.isWorldPointCoveredByHud(target.x, target.y) &&
        this.isChiefPathAllowed(fromX, fromY, target.x, target.y)
      ) {
        this.chiefTarget = target;
        this.chiefWaitUntil = 0;
        return;
      }
    }

    this.chiefTarget = null;
    this.chiefWaitUntil = time + Phaser.Math.Between(900, 1800);
  }

  private isChiefPathAllowed(fromX: number, fromY: number, toX: number, toY: number) {
    for (let index = 1; index <= 12; index += 1) {
      const t = index / 12;
      const x = Phaser.Math.Linear(fromX, toX, t);
      const y = Phaser.Math.Linear(fromY, toY, t);
      if (this.isChiefWorldObjectBlocked(x, y)) {
        return false;
      }
    }
    return true;
  }

  private isChiefPointBlocked(x: number, y: number) {
    return this.isChiefWorldObjectBlocked(x, y) || this.isWorldPointCoveredByHud(x, y);
  }

  private isChiefWorldObjectBlocked(x: number, y: number) {
    const padding = 18;
    if (
      x < padding ||
      y < padding ||
      x > this.mapBounds.width - padding ||
      y > this.mapBounds.height - padding
    ) {
      return true;
    }
    if (this.blockedWorldRects.some((rect) => rect.contains(x, y))) {
      return true;
    }
    return false;
  }

  private updateResidentNpcs(time: number, delta: number) {
    if (this.mapBounds.width <= 0 || this.mapBounds.height <= 0) {
      return;
    }
    for (const state of this.residentNpcStates) {
      this.updateSingleResidentNpc(state, time, delta);
    }
  }

  private updateSingleResidentNpc(state: ResidentNpcState, time: number, delta: number) {
    if (!state.target && time < state.waitUntil) {
      return;
    }

    if (
      !state.target ||
      this.isWorldPointCoveredByHud(state.worldPosition.x, state.worldPosition.y)
    ) {
      this.chooseResidentTarget(state, time);
    }

    if (!state.target) {
      return;
    }

    const dx = state.target.x - state.worldPosition.x;
    const dy = state.target.y - state.worldPosition.y;
    const distance = Math.hypot(dx, dy);

    if (distance <= CHIEF_NPC_TARGET_RADIUS) {
      state.target = null;
      state.velocity.scale(0.72);
      state.waitUntil = time + Phaser.Math.Between(900, 2200);
      this.applyResidentDisplayMotion(state, time, 0, 0, false);
      return;
    }

    const desiredVelocity = new Phaser.Math.Vector2(dx / distance, dy / distance).scale(
      CHIEF_NPC_SPEED,
    );
    state.velocity.lerp(desiredVelocity, Math.min(1, CHIEF_NPC_STEERING * (delta / 16.67)));

    const nextX = state.worldPosition.x + (state.velocity.x * delta) / 1000;
    const nextY = state.worldPosition.y + (state.velocity.y * delta) / 1000;

    if (this.isChiefPointBlocked(nextX, nextY)) {
      state.target = null;
      state.velocity.set(0, 0);
      state.waitUntil = time + 500;
      this.applyResidentDisplayMotion(state, time, 0, 0, false);
      return;
    }

    state.worldPosition.set(nextX, nextY);
    this.applyResidentDisplayMotion(state, time, state.velocity.x, state.velocity.y, true);
  }

  private applyResidentDisplayMotion(
    state: ResidentNpcState,
    time: number,
    dx: number,
    dy: number,
    moving: boolean,
  ) {
    const bobPhase = Math.sin(time * CHIEF_NPC_BOB_FREQUENCY);
    const bob = moving ? Math.max(0, bobPhase) : 0;
    const yOffset = -bob * CHIEF_NPC_BOB_AMPLITUDE;

    state.npc.setPosition(state.worldPosition.x, state.worldPosition.y + yOffset);
    state.npc.setDepth(state.worldPosition.y);

    if (moving && Math.abs(dx) > Math.abs(dy) * 0.25) {
      state.npc.setFlipX(dx < 0);
    }
  }

  private chooseResidentTarget(state: ResidentNpcState, time: number) {
    const margin = 56;
    const fromX = state.worldPosition.x;
    const fromY = state.worldPosition.y;

    for (let attempt = 0; attempt < CHIEF_NPC_TARGET_RETRIES; attempt += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(
        CHIEF_NPC_MIN_WANDER_DISTANCE,
        CHIEF_NPC_MAX_WANDER_DISTANCE,
      );
      const target = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(
          fromX + Math.cos(angle) * distance,
          margin,
          this.mapBounds.width - margin,
        ),
        Phaser.Math.Clamp(
          fromY + Math.sin(angle) * distance,
          margin,
          this.mapBounds.height - margin,
        ),
      );
      if (
        !this.isWorldPointCoveredByHud(target.x, target.y) &&
        this.isChiefPathAllowed(fromX, fromY, target.x, target.y)
      ) {
        state.target = target;
        state.waitUntil = 0;
        return;
      }
    }

    state.target = null;
    state.waitUntil = time + Phaser.Math.Between(900, 1800);
  }

  private isWorldPointCoveredByHud(worldX: number, worldY: number) {
    const camera = this.cameras.main;
    const screenX = (worldX - camera.worldView.x) * camera.zoom;
    const screenY = (worldY - camera.worldView.y) * camera.zoom;
    const width = camera.width;
    const height = camera.height;
    if (screenX < 0 || screenY < 0 || screenX > width || screenY > height) {
      return false;
    }

    return this.getHudAvoidRects(width, height).some((rect) => rect.contains(screenX, screenY));
  }

  private getHudAvoidRects(width: number, height: number) {
    const headerHeight = width <= 760 ? 74 : 92;
    const logoWidth = width <= 760 ? 140 : width <= 1060 ? 168 : 188;
    const topRightWidth = width <= 760 ? 250 : width <= 1060 ? 440 : 500;
    const todoTop = width <= 1060 ? 190 : 80;
    const todoWidth = Math.min(360, Math.max(0, width - 38));
    const todoHeight = Math.min(width <= 1060 ? 590 : 586, Math.max(0, height - 18));
    const bottomButtonWidth = width <= 760 ? Math.min(220, width) : 230;
    const bottomButtonHeight = 94;
    const minimapWidth =
      width <= 760
        ? Math.min(258, Math.max(0, width - 28))
        : height <= 820
          ? Math.min(256, Math.max(0, width - 56))
          : width <= 1060
            ? Math.min(346, Math.max(0, width - 48))
            : Math.min(292, Math.max(0, width - 64));
    const minimapHeight = width <= 760 ? 184 : height <= 820 ? 186 : width <= 1060 ? 238 : 210;
    const minimapX = width <= 760 ? 14 : height <= 820 ? 28 : width <= 1060 ? 24 : 20;

    return [
      new Phaser.Geom.Rectangle(0, 0, Math.min(logoWidth, width), Math.min(headerHeight, height)),
      new Phaser.Geom.Rectangle(
        Math.max(0, width - topRightWidth),
        0,
        topRightWidth,
        Math.min(headerHeight, height),
      ),
      new Phaser.Geom.Rectangle(
        Math.max(0, width - todoWidth - 20),
        Math.min(todoTop, height),
        todoWidth + 20,
        Math.min(todoHeight, Math.max(0, height - todoTop)),
      ),
      new Phaser.Geom.Rectangle(
        Math.max(0, width / 2 - bottomButtonWidth / 2),
        Math.max(0, height - bottomButtonHeight),
        bottomButtonWidth,
        bottomButtonHeight,
      ),
      new Phaser.Geom.Rectangle(
        minimapX,
        Math.max(0, height - minimapHeight),
        minimapWidth + 20,
        minimapHeight,
      ),
    ];
  }

  private updateChiefMinimapMarker() {
    if (!this.chiefNpc) {
      return;
    }
    const marker = this.minimapMarkers.find((item) => item.id === "chief-npc");
    if (!marker) {
      return;
    }
    marker.x = this.chiefWorldPosition.x;
    marker.y = this.chiefWorldPosition.y;
  }

  private addClickableObjectHover(
    target: Phaser.GameObjects.Image,
    hint: ActiveObjectHint,
    hoverScale = 1.06,
  ) {
    const baseScaleX = target.scaleX;
    const baseScaleY = target.scaleY;

    const reset = () => {
      this.tweens.killTweensOf(target);
      target.clearTint();
      this.activeObjectHint = null;
      this.lastObjectHintSignature = "";
      this.publishObjectHint({ ...hint, visible: false });
      this.tweens.add({
        targets: target,
        duration: 120,
        ease: "Quad.easeOut",
        scaleX: baseScaleX,
        scaleY: baseScaleY,
      });
    };

    target.on("pointerover", () => {
      this.tweens.killTweensOf(target);
      target.setTint(0xfff0b0);
      this.activeObjectHint = hint;
      this.publishObjectHint({ ...hint, visible: true });
      this.tweens.add({
        targets: target,
        duration: 120,
        ease: "Quad.easeOut",
        scaleX: baseScaleX * hoverScale,
        scaleY: baseScaleY * hoverScale,
      });
    });

    target.on("pointerdown", () => {
      this.tweens.killTweensOf(target);
      this.tweens.add({
        targets: target,
        duration: 70,
        ease: "Quad.easeOut",
        scaleX: baseScaleX * 0.98,
        scaleY: baseScaleY * 0.98,
      });
    });

    target.on("pointerup", () => {
      if (target.input?.enabled) {
        this.tweens.killTweensOf(target);
        this.tweens.add({
          targets: target,
          duration: 90,
          ease: "Quad.easeOut",
          scaleX: baseScaleX * hoverScale,
          scaleY: baseScaleY * hoverScale,
        });
      }
    });

    target.on("pointerout", reset);
  }

  private publishActiveObjectHint() {
    if (!this.activeObjectHint) {
      return;
    }
    this.publishObjectHint({ ...this.activeObjectHint, visible: true });
  }

  private publishHoveredResidentHint() {
    if (!this.hoveredResidentNpc) {
      return;
    }
    const { state, label } = this.hoveredResidentNpc;
    // NPC origin이 (0.5, 0.86)이므로 머리 위 약 38px 위에 힌트 표시
    this.publishObjectHint({
      label,
      visible: true,
      worldX: state.worldPosition.x,
      worldY: state.worldPosition.y - 38,
    });
  }

  private publishObjectHint({
    label,
    visible,
    worldX,
    worldY,
  }: ActiveObjectHint & { visible: boolean }) {
    const camera = this.cameras.main;
    const canvasRect = this.game.canvas.getBoundingClientRect();
    const parentRect = this.game.canvas.parentElement?.getBoundingClientRect();
    const cssScaleX = canvasRect.width / camera.width;
    const cssScaleY = canvasRect.height / camera.height;
    const x =
      (parentRect ? canvasRect.left - parentRect.left : 0) +
      (worldX - camera.worldView.x) * camera.zoom * cssScaleX;
    const y =
      (parentRect ? canvasRect.top - parentRect.top : 0) +
      (worldY - camera.worldView.y) * camera.zoom * cssScaleY;
    const signature = [label, visible ? "1" : "0", x.toFixed(1), y.toFixed(1)].join(":");
    if (signature === this.lastObjectHintSignature) {
      return;
    }
    this.lastObjectHintSignature = signature;
    window.dispatchEvent(
      new CustomEvent<ObjectHintState>("mongle-object-hint-update", {
        detail: {
          label,
          visible,
          x,
          y,
        },
      }),
    );
  }

  private createMinimapSnapshot(map: TiledMap, tilesets: TilesetMeta[]) {
    const mapPixelWidth = map.width * map.tilewidth;
    const mapPixelHeight = map.height * map.tileheight;
    const minimapTexture = this.make.renderTexture({
      height: mapPixelHeight,
      width: mapPixelWidth,
      x: 0,
      y: 0,
    });

    minimapTexture.fill(0x47783d, 1);
    map.layers
      .filter((layer) => layer.type === "tilelayer" && layer.visible)
      .forEach((layer) => {
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
            minimapTexture.drawFrame(tileset.name, frame, x, y);
          }
        });
      });

    return new Promise<void>((resolve) => {
      minimapTexture.snapshot((snapshot) => {
        if (snapshot instanceof HTMLImageElement) {
          this.minimapImageUrl = snapshot.src;
        } else if (snapshot instanceof HTMLCanvasElement) {
          this.minimapImageUrl = snapshot.toDataURL("image/png");
        }
        minimapTexture.destroy();
        resolve();
      });
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
    this.updateCameraCursor();

    const canvas = this.game.canvas;
    const handleCanvasWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      this.zoomAtPoint(event.deltaY, event.clientX - bounds.left, event.clientY - bounds.top);
    };
    canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
    this.cleanupCameraControls.push(() => canvas.removeEventListener("wheel", handleCanvasWheel));

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
    this.publishMinimapStateIfChanged();
  }

  private updateCameraCursor() {
    this.input.setDefaultCursor(this.cameras.main.zoom > this.baseZoom ? "grab" : "default");
  }

  private destroyCameraControls() {
    for (const cleanup of this.cleanupCameraControls) {
      cleanup();
    }
    this.cleanupCameraControls = [];
  }

  private publishMinimapStateIfChanged() {
    if (this.mapBounds.width <= 0 || this.mapBounds.height <= 0) {
      return;
    }

    const camera = this.cameras.main;
    const worldView = camera.worldView;
    const viewportX = Number.isFinite(worldView.x) ? worldView.x : camera.scrollX;
    const viewportY = Number.isFinite(worldView.y) ? worldView.y : camera.scrollY;
    const viewportWidth =
      worldView.width > 0 && Number.isFinite(worldView.width)
        ? worldView.width
        : camera.width / camera.zoom;
    const viewportHeight =
      worldView.height > 0 && Number.isFinite(worldView.height)
        ? worldView.height
        : camera.height / camera.zoom;
    const signature = [
      viewportX.toFixed(2),
      viewportY.toFixed(2),
      viewportWidth.toFixed(2),
      viewportHeight.toFixed(2),
      camera.zoom.toFixed(4),
      this.minimapImageUrl.length,
      this.minimapMarkers.length,
      ...this.minimapMarkers.map(
        (marker) => `${marker.id}:${marker.x.toFixed(1)},${marker.y.toFixed(1)}`,
      ),
    ].join(":");
    if (signature === this.lastMinimapSignature) {
      return;
    }
    this.lastMinimapSignature = signature;

    window.dispatchEvent(
      new CustomEvent<MinimapState>("mongle-minimap-update", {
        detail: {
          mapHeight: this.mapBounds.height,
          mapWidth: this.mapBounds.width,
          imageUrl: this.minimapImageUrl,
          markers: this.minimapMarkers,
          viewportHeight,
          viewportWidth,
          viewportX,
          viewportY,
        },
      }),
    );
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
}

export function PhaserVillage({
  reloadKey,
  onOpenBoard,
  onOpenDialogue,
  residents,
}: PhaserVillageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [minimapState, setMinimapState] = useState<MinimapState | null>(null);
  const [objectHint, setObjectHint] = useState<ObjectHintState | null>(null);
  const [villageReady, setVillageReady] = useState(false);

  // 최신 콜백·주민을 ref로 유지해서, 이 값들이 바뀌어도 Phaser 게임을 재생성하지 않는다.
  // (게임 전체 destroy/재생성 = 배경 깜빡임. 모달을 열 때마다 일어나던 현상의 원인)
  const onOpenBoardRef = useRef(onOpenBoard);
  const onOpenDialogueRef = useRef(onOpenDialogue);
  const residentsRef = useRef(residents);
  onOpenBoardRef.current = onOpenBoard;
  onOpenDialogueRef.current = onOpenDialogue;
  residentsRef.current = residents;

  // ponytail: 주민 명단은 id 집합으로만 비교한다. 아바타 URL이 매 fetch마다 달라져도(프리사인 등)
  // 재생성을 트리거하지 않게 하기 위함. 아바타 갱신은 reloadKey 증가 시 반영된다.
  const residentSignature = residents.map((r) => r.id).join("|");

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    setVillageReady(false);
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
      scene: new VillageScene(
        `VillageScene-${reloadKey}-${residentSignature}`,
        () => onOpenDialogueRef.current(),
        () => onOpenBoardRef.current(),
        () => disposed,
        residentsRef.current,
      ),
      type: Phaser.AUTO,
    });

    return () => {
      disposed = true;
      game.destroy(true);
    };
    // residentSignature: 실제 주민 명단(id)이 바뀔 때만 재생성. reloadKey: 명시적 새로고침.
  }, [reloadKey, residentSignature]);

  useEffect(() => {
    function handleMinimapUpdate(event: Event) {
      setMinimapState((event as CustomEvent<MinimapState>).detail);
    }

    window.addEventListener("mongle-minimap-update", handleMinimapUpdate);
    return () => window.removeEventListener("mongle-minimap-update", handleMinimapUpdate);
  }, []);

  useEffect(() => {
    function handleObjectHintUpdate(event: Event) {
      const detail = (event as CustomEvent<ObjectHintState>).detail;
      setObjectHint(detail.visible ? detail : null);
    }

    window.addEventListener("mongle-object-hint-update", handleObjectHintUpdate);
    return () => window.removeEventListener("mongle-object-hint-update", handleObjectHintUpdate);
  }, []);

  useEffect(() => {
    function handleVillageReady() {
      setVillageReady(true);
    }

    window.addEventListener("mongle-village-ready", handleVillageReady);
    return () => window.removeEventListener("mongle-village-ready", handleVillageReady);
  }, []);

  const viewportStyle = getMinimapViewportStyle(minimapState);
  const markers = minimapState?.markers ?? [];

  return (
    <>
      <div
        ref={containerRef}
        className="phaserLayer"
        role="img"
        aria-label="몽글마을 Phaser 배경"
      />
      <FullScreenLoader show={!villageReady} />
      {objectHint ? (
        <span
          className="villageObjectHint"
          style={{ left: objectHint.x, top: objectHint.y }}
          aria-hidden="true"
        >
          {objectHint.label}
        </span>
      ) : null}
      <aside className="villageMinimap" aria-label="마을 미니맵">
        <span className="villageMinimapFrame" aria-hidden="true">
          {minimapState?.imageUrl ? (
            <img className="villageMinimapImage" src={minimapState.imageUrl} alt="" />
          ) : (
            <span className="villageMinimapFallback" />
          )}
          {markers.map((marker) => (
            <span
              key={marker.id}
              className={`villageMinimapMarker is${capitalize(marker.type)}`}
              style={getMinimapMarkerStyle(marker, minimapState)}
              title={marker.label}
            />
          ))}
          <span className="villageMinimapViewport" style={viewportStyle} />
        </span>
      </aside>
    </>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toPercent(value: number) {
  return `${Phaser.Math.Clamp(value, 0, 100)}%`;
}

function getMinimapViewportStyle(state: MinimapState | null): CSSProperties {
  if (!state) {
    return {
      height: "30%",
      left: "23%",
      top: "20%",
      width: "28%",
    };
  }

  return {
    height: toPercent((state.viewportHeight / state.mapHeight) * 100),
    left: toPercent((state.viewportX / state.mapWidth) * 100),
    top: toPercent((state.viewportY / state.mapHeight) * 100),
    width: toPercent((state.viewportWidth / state.mapWidth) * 100),
  };
}

function getMinimapMarkerStyle(marker: MinimapMarker, state: MinimapState | null): CSSProperties {
  if (!state) {
    return {};
  }
  return {
    left: toPercent((marker.x / state.mapWidth) * 100),
    top: toPercent((marker.y / state.mapHeight) * 100),
  };
}
