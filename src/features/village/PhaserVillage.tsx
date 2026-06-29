// @refresh reset
import Phaser from "phaser";
import { useEffect, useRef, useState } from "react";
import { FullScreenLoader } from "../../shared/ui/FullScreenLoader.js";
import {
  colorOf,
  RESIDENT_HOUSE_COLORS,
  RESIDENT_OFFSETS,
} from "../../shared/ui/village/residence.js";
import "./PhaserVillage.css";

const MAP_BASE_PATH = "/assets/map";
const MAP_PATH = `${MAP_BASE_PATH}/mongle.tmj`;
const BOARD_KEY = "village-board";
const BOARD_PATH = "/assets/objects/board.png";
const CHIEF_HOUSE_KEY = "chief-house";
const CHIEF_HOUSE_PATH = "/assets/objects/chief_house.png";
const RESIDENT_HOUSE_DISPLAY_WIDTH = 84;
const RESIDENT_HOUSE_DISPLAY_HEIGHT = 76;
const CHIEF_NPC_KEY = "chief-npc";
const CHIEF_NPC_PATH = "/assets/mongle_chief.png";
const CHIEF_NPC_SPEED = 12;
const CHIEF_NPC_DISPLAY_SIZE = 50;
const CHIEF_NPC_BOB_AMPLITUDE = 2.0;
const CHIEF_NPC_BOB_FREQUENCY = 0.006;
const CHIEF_NPC_TARGET_RADIUS = 2.5;
const CHIEF_NPC_TARGET_RETRIES = 60;
const CHIEF_NPC_STEERING = 7.5;
const CHIEF_NPC_ARRIVAL_RADIUS = 28;
const CHIEF_NPC_MIN_SPEED_FACTOR = 0.24;
const CHIEF_NPC_MIN_WANDER_DISTANCE = 72;
const CHIEF_NPC_MAX_WANDER_DISTANCE = 180;
const NPC_HUD_PADDING = 12;
const NPC_HUD_ESCAPE_GAP = 2;
const NPC_MAX_FRAME_DELTA = 34;
const DECORATION_LAYER_NAME = "타일 레이어 4";
const BASIC_GRASS_OBJECTS_SOURCE = "Basic Grass Biom things 1.tsx";
// 여러 타일에 걸친 큰 나무만 막는다.
// 작은 나무·관목과 돌·꽃·버섯·바구니 같은 장식은 자연스럽게 통과할 수 있다.
const BLOCKING_OBJECT_FRAMES = new Set([0, 1, 2, 3, 4]);
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
  inputBlocked: boolean;
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

function getHudAvoidRects(width: number, height: number) {
  const pomodoroX = 23;
  const pomodoroY = 100;
  const pomodoroWidth = Math.min(300, Math.max(0, width - 52));
  const pomodoroHeight = 196;
  const todoTop = width <= 1060 ? 190 : 80;
  const todoWidth = Math.min(360, Math.max(0, width - 38));
  const todoHeight = Math.min(width <= 1060 ? 590 : 586, Math.max(0, height - 18));

  return [
    new Phaser.Geom.Rectangle(
      pomodoroX,
      pomodoroY,
      pomodoroWidth,
      Math.min(pomodoroHeight, Math.max(0, height - pomodoroY)),
    ),
    new Phaser.Geom.Rectangle(
      Math.max(0, width - todoWidth - 20),
      Math.min(todoTop, height),
      todoWidth,
      Math.min(todoHeight, Math.max(0, height - todoTop)),
    ),
  ];
}

function getPaddedHudAvoidRects(width: number, height: number) {
  return getHudAvoidRects(width, height).map(
    (rect) =>
      new Phaser.Geom.Rectangle(
        rect.x - NPC_HUD_PADDING,
        rect.y - NPC_HUD_PADDING,
        rect.width + NPC_HUD_PADDING * 2,
        rect.height + NPC_HUD_PADDING * 2,
      ),
  );
}

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
  private isInputBlocked = false;
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
  private mapBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);

  constructor(
    sceneKey: string,
    onOpenDialogue: () => void,
    onOpenBoard: () => void,
    isDisposed: () => boolean,
    residents: ResidentPreview[],
    inputBlocked: boolean,
  ) {
    super(sceneKey);
    this.isDisposed = isDisposed;
    this.onOpenBoard = onOpenBoard;
    this.onOpenDialogue = onOpenDialogue;
    this.residents = residents;
    this.isInputBlocked = inputBlocked;
  }

  create() {
    this.cameras.main.setBackgroundColor("#47783d");
    // pixelArt 모드는 기본적으로 좌표를 정수 픽셀로 반올림한다. 맵 텍스처는 선명하게
    // 유지하되 느리게 움직이는 NPC는 소수점 좌표로 그려 계단식 이동을 방지한다.
    this.cameras.main.roundPixels = false;
    this.input.enabled = !this.isInputBlocked;
    void this.buildVillage();
  }

  setInputBlocked(blocked: boolean) {
    this.isInputBlocked = blocked;
    if (!this.input) {
      return;
    }
    this.input.enabled = !blocked;
    if (blocked) {
      this.dragStart = null;
      this.hasDragged = false;
      this.input.setDefaultCursor("default");
    } else {
      this.updateCameraCursor();
    }
  }

  update(time: number, delta: number) {
    const movementDelta = Math.min(delta, NPC_MAX_FRAME_DELTA);
    this.updateChiefNpc(time, movementDelta);
    this.updateResidentNpcs(time, movementDelta);
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
      this.fitCamera(map);
      this.scale.on(Phaser.Scale.Events.RESIZE, () => this.fitCamera(map));
      this.configureCameraControls();
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
      } catch {
        // Tiled에 남아 있는 임시 tileset은 렌더링에서 제외한다.
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
            // crossOrigin <img> 대신 cors fetch→blob→objectURL 로 텍스처를 굽는다.
            // 결과 모달/토스트가 같은 S3 URL을 일반 <img>(no-cors)로 먼저 렌더하면
            // 브라우저가 그 URL을 CORS 헤더 없는 opaque 응답으로 캐싱하고, 마을의
            // crossOrigin 재요청이 그 캐시를 재사용해 실패(→NPC 누락)한다. cors fetch 는
            // opaque 캐시를 재사용하지 않아 항상 CORS-clean 이미지를 얻는다.
            const response = await fetch(resident.avatarUrl ?? "", { mode: "cors" });
            if (!response.ok) {
              return;
            }
            const objectUrl = URL.createObjectURL(await response.blob());
            try {
              const img = new Image();
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = objectUrl;
              });
              if (!this.textures.exists(key)) {
                this.textures.addImage(key, img);
              }
            } finally {
              URL.revokeObjectURL(objectUrl);
            }
          } catch {
            // 로드 실패 시 NPC 없이 집만 표시(폴백)
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

    this.residents.slice(0, RESIDENT_OFFSETS.length).forEach((resident, index) => {
      const [offsetX, offsetY] = RESIDENT_OFFSETS[index];
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
      const color = colorOf(resident.id);
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
    });
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

    if (this.moveWorldPointOutsideHud(this.chiefWorldPosition)) {
      this.chiefTarget = null;
      this.chiefVelocity.set(0, 0);
      this.applyChiefDisplayMotion(time, 0, 0, false);
    }

    if (!this.chiefTarget && time < this.chiefWaitUntil) {
      return;
    }

    if (
      !this.chiefTarget ||
      this.isWorldPointCoveredByHud(this.chiefWorldPosition.x, this.chiefWorldPosition.y)
    ) {
      this.chooseChiefTargetFromCurrent(time);
    }

    if (!this.chiefTarget) {
      return;
    }

    const dx = this.chiefTarget.x - this.chiefWorldPosition.x;
    const dy = this.chiefTarget.y - this.chiefWorldPosition.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= CHIEF_NPC_TARGET_RADIUS) {
      this.chiefTarget = null;
      this.chiefVelocity.set(0, 0);
      this.chiefWaitUntil = time + Phaser.Math.Between(700, 1800);
      this.applyChiefDisplayMotion(time, 0, 0, false);
      return;
    }

    const arrivalFactor = Phaser.Math.Clamp(
      distance / CHIEF_NPC_ARRIVAL_RADIUS,
      CHIEF_NPC_MIN_SPEED_FACTOR,
      1,
    );
    const desiredVelocity = new Phaser.Math.Vector2(dx / distance, dy / distance).scale(
      CHIEF_NPC_SPEED * arrivalFactor,
    );
    const steeringAmount = 1 - Math.exp((-CHIEF_NPC_STEERING * delta) / 1000);
    this.chiefVelocity.lerp(desiredVelocity, steeringAmount);

    const stepX = (this.chiefVelocity.x * delta) / 1000;
    const stepY = (this.chiefVelocity.y * delta) / 1000;
    const movement = this.resolveNpcMovement(
      this.chiefWorldPosition.x,
      this.chiefWorldPosition.y,
      stepX,
      stepY,
    );
    if (!movement) {
      this.chiefTarget = null;
      this.chiefVelocity.set(0, 0);
      this.chiefWaitUntil = time + Phaser.Math.Between(180, 420);
      this.applyChiefDisplayMotion(time, 0, 0, false);
      return;
    }

    if (movement.dx === 0) {
      this.chiefVelocity.x = 0;
    }
    if (movement.dy === 0) {
      this.chiefVelocity.y = 0;
    }
    this.chiefWorldPosition.set(movement.x, movement.y);
    this.applyChiefDisplayMotion(time, movement.dx, movement.dy, true);
  }

  private applyChiefDisplayMotion(time: number, dx: number, dy: number, moving: boolean) {
    if (!this.chiefNpc) {
      return;
    }

    const bob = moving ? Math.abs(Math.sin(time * CHIEF_NPC_BOB_FREQUENCY)) : 0;
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
        this.isNpcPathAllowed(fromX, fromY, target.x, target.y)
      ) {
        this.chiefTarget = target;
        this.chiefWaitUntil = 0;
        return;
      }
    }

    this.chiefTarget = null;
    this.chiefWaitUntil = time + Phaser.Math.Between(900, 1800);
  }

  private isNpcPathAllowed(fromX: number, fromY: number, toX: number, toY: number) {
    for (let index = 1; index <= 24; index += 1) {
      const t = index / 24;
      const x = Phaser.Math.Linear(fromX, toX, t);
      const y = Phaser.Math.Linear(fromY, toY, t);
      if (this.isChiefWorldObjectBlocked(x, y) || this.isWorldPointCoveredByHud(x, y)) {
        return false;
      }
    }
    return true;
  }

  private isChiefPointBlocked(x: number, y: number) {
    return this.isChiefWorldObjectBlocked(x, y) || this.isWorldPointCoveredByHud(x, y);
  }

  private resolveNpcMovement(fromX: number, fromY: number, stepX: number, stepY: number) {
    const axisCandidates = [
      { dx: stepX, dy: 0 },
      { dx: 0, dy: stepY },
    ].sort((a, b) => Math.hypot(b.dx, b.dy) - Math.hypot(a.dx, a.dy));
    const candidates = [{ dx: stepX, dy: stepY }, ...axisCandidates];

    for (const candidate of candidates) {
      if (candidate.dx === 0 && candidate.dy === 0) {
        continue;
      }
      const x = fromX + candidate.dx;
      const y = fromY + candidate.dy;
      if (!this.isChiefPointBlocked(x, y)) {
        return { ...candidate, x, y };
      }
    }

    return null;
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
    if (this.moveWorldPointOutsideHud(state.worldPosition)) {
      state.target = null;
      state.velocity.set(0, 0);
      this.applyResidentDisplayMotion(state, time, 0, 0, false);
    }

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
      state.velocity.set(0, 0);
      state.waitUntil = time + Phaser.Math.Between(700, 1800);
      this.applyResidentDisplayMotion(state, time, 0, 0, false);
      return;
    }

    const arrivalFactor = Phaser.Math.Clamp(
      distance / CHIEF_NPC_ARRIVAL_RADIUS,
      CHIEF_NPC_MIN_SPEED_FACTOR,
      1,
    );
    const desiredVelocity = new Phaser.Math.Vector2(dx / distance, dy / distance).scale(
      CHIEF_NPC_SPEED * arrivalFactor,
    );
    const steeringAmount = 1 - Math.exp((-CHIEF_NPC_STEERING * delta) / 1000);
    state.velocity.lerp(desiredVelocity, steeringAmount);

    const stepX = (state.velocity.x * delta) / 1000;
    const stepY = (state.velocity.y * delta) / 1000;
    const movement = this.resolveNpcMovement(
      state.worldPosition.x,
      state.worldPosition.y,
      stepX,
      stepY,
    );
    if (!movement) {
      state.target = null;
      state.velocity.set(0, 0);
      state.waitUntil = time + Phaser.Math.Between(180, 420);
      this.applyResidentDisplayMotion(state, time, 0, 0, false);
      return;
    }

    if (movement.dx === 0) {
      state.velocity.x = 0;
    }
    if (movement.dy === 0) {
      state.velocity.y = 0;
    }
    state.worldPosition.set(movement.x, movement.y);
    this.applyResidentDisplayMotion(state, time, movement.dx, movement.dy, true);
  }

  private applyResidentDisplayMotion(
    state: ResidentNpcState,
    time: number,
    dx: number,
    dy: number,
    moving: boolean,
  ) {
    const bob = moving ? Math.abs(Math.sin(time * CHIEF_NPC_BOB_FREQUENCY)) : 0;
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
        this.isNpcPathAllowed(fromX, fromY, target.x, target.y)
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

    return getPaddedHudAvoidRects(width, height).some((rect) => rect.contains(screenX, screenY));
  }

  private moveWorldPointOutsideHud(worldPosition: Phaser.Math.Vector2) {
    const camera = this.cameras.main;
    const screenPoint = new Phaser.Math.Vector2(
      (worldPosition.x - camera.worldView.x) * camera.zoom,
      (worldPosition.y - camera.worldView.y) * camera.zoom,
    );
    const hudRects = getPaddedHudAvoidRects(camera.width, camera.height);

    if (!hudRects.some((rect) => rect.contains(screenPoint.x, screenPoint.y))) {
      return false;
    }

    const candidates: Phaser.Math.Vector2[] = [];
    for (const rect of hudRects) {
      if (!rect.contains(screenPoint.x, screenPoint.y)) {
        continue;
      }
      candidates.push(
        new Phaser.Math.Vector2(rect.left - NPC_HUD_ESCAPE_GAP, screenPoint.y),
        new Phaser.Math.Vector2(rect.right + NPC_HUD_ESCAPE_GAP, screenPoint.y),
        new Phaser.Math.Vector2(screenPoint.x, rect.top - NPC_HUD_ESCAPE_GAP),
        new Phaser.Math.Vector2(screenPoint.x, rect.bottom + NPC_HUD_ESCAPE_GAP),
      );
    }

    candidates.sort(
      (a, b) =>
        Phaser.Math.Distance.Squared(screenPoint.x, screenPoint.y, a.x, a.y) -
        Phaser.Math.Distance.Squared(screenPoint.x, screenPoint.y, b.x, b.y),
    );

    for (const candidate of candidates) {
      if (
        candidate.x < 0 ||
        candidate.y < 0 ||
        candidate.x > camera.width ||
        candidate.y > camera.height ||
        hudRects.some((rect) => rect.contains(candidate.x, candidate.y))
      ) {
        continue;
      }

      const worldX = camera.worldView.x + candidate.x / camera.zoom;
      const worldY = camera.worldView.y + candidate.y / camera.zoom;
      if (this.isChiefWorldObjectBlocked(worldX, worldY)) {
        continue;
      }

      worldPosition.set(worldX, worldY);
      return true;
    }

    return false;
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
      if (this.isInputBlocked) {
        return;
      }
      event.preventDefault();
      const { x, y } = this.toCameraScreenPoint(event.clientX, event.clientY);
      this.zoomAtPoint(event.deltaY, x, y);
    };
    canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
    this.cleanupCameraControls.push(() => canvas.removeEventListener("wheel", handleCanvasWheel));

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (
        this.isInputBlocked ||
        !pointer.leftButtonDown() ||
        this.cameras.main.zoom <= this.baseZoom
      ) {
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
    camera.preRender();
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

  private toCameraScreenPoint(clientX: number, clientY: number) {
    const camera = this.cameras.main;
    const bounds = this.game.canvas.getBoundingClientRect();
    const scaleX = bounds.width > 0 ? camera.width / bounds.width : 1;
    const scaleY = bounds.height > 0 ? camera.height / bounds.height : 1;

    return {
      x: Phaser.Math.Clamp((clientX - bounds.left) * scaleX, 0, camera.width),
      y: Phaser.Math.Clamp((clientY - bounds.top) * scaleY, 0, camera.height),
    };
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

    camera.preRender();
    const before = camera.getWorldPoint(screenX, screenY);
    camera.setZoom(nextZoom);
    this.cameraCenter.x = before.x - (screenX - camera.width / 2) / nextZoom;
    this.cameraCenter.y = before.y - (screenY - camera.height / 2) / nextZoom;
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
  inputBlocked,
  reloadKey,
  onOpenBoard,
  onOpenDialogue,
  residents,
}: PhaserVillageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<VillageScene | null>(null);
  const [objectHint, setObjectHint] = useState<ObjectHintState | null>(null);
  const [villageReady, setVillageReady] = useState(false);

  // 최신 콜백·주민을 ref로 유지해서, 이 값들이 바뀌어도 Phaser 게임을 재생성하지 않는다.
  // (게임 전체 destroy/재생성 = 배경 깜빡임. 모달을 열 때마다 일어나던 현상의 원인)
  const onOpenBoardRef = useRef(onOpenBoard);
  const onOpenDialogueRef = useRef(onOpenDialogue);
  const residentsRef = useRef(residents);
  const inputBlockedRef = useRef(inputBlocked);
  onOpenBoardRef.current = onOpenBoard;
  onOpenDialogueRef.current = onOpenDialogue;
  residentsRef.current = residents;
  inputBlockedRef.current = inputBlocked;

  // ponytail: 주민 명단은 id 집합으로만 비교한다. 아바타 URL이 매 fetch마다 달라져도(프리사인 등)
  // 재생성을 트리거하지 않게 하기 위함. 아바타 갱신은 reloadKey 증가 시 반영된다.
  const residentSignature = residents.map((r) => r.id).join("|");

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const container = containerRef.current;
    setVillageReady(false);
    let disposed = false;
    const scene = new VillageScene(
      `VillageScene-${reloadKey}-${residentSignature}`,
      () => onOpenDialogueRef.current(),
      () => onOpenBoardRef.current(),
      () => disposed,
      residentsRef.current,
      inputBlockedRef.current,
    );
    sceneRef.current = scene;
    const game = new Phaser.Game({
      backgroundColor: "#47783d",
      parent: container,
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
      scene,
      type: Phaser.AUTO,
    });

    return () => {
      disposed = true;
      sceneRef.current = null;
      game.destroy(true);
    };
    // residentSignature: 실제 주민 명단(id)이 바뀔 때만 재생성. reloadKey: 명시적 새로고침.
  }, [reloadKey, residentSignature]);

  useEffect(() => {
    sceneRef.current?.setInputBlocked(inputBlocked);
  }, [inputBlocked]);

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

  return (
    <>
      <div
        ref={containerRef}
        className={`phaserLayer${inputBlocked ? " isInputBlocked" : ""}`}
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
    </>
  );
}
