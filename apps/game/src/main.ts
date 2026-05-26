import Phaser from "phaser";
import "./style.css";

type AiTodoCandidate = {
  title: string;
  due_date: string;
  time_hint?: string | null;
  tags?: string[];
};

type EntityKind = "chef" | "gardener" | "scribe" | "hall" | "bakery" | "cottage" | "library";

type VillageEntity = {
  id: EntityKind;
  name: string;
  role: string;
  message: string;
  options: string[];
  portrait: string;
};

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

type Resident = {
  id: string;
  name: string;
  persona: string;
  speech: string;
  portrait: string;
};

type Quest = {
  id: string;
  todoId: string;
  characterId: string;
  text: string;
  status: "PENDING" | "COMPLETED";
};

type FeedPost = {
  id: string;
  characterId: string;
  questId: string;
  caption: string;
  liked: boolean;
};

const entities: Record<EntityKind, VillageEntity> = {
  chef: {
    id: "chef",
    name: "CHEF HOUSE",
    role: "CHEF",
    message: "따뜻한 수프처럼, 오늘 일도 작게 나눠서 끓이면 돼.",
    options: ["오늘의 TODO 만들기", "점심 전까지 집중하기", "물 한 잔 마시기"],
    portrait: "chef",
  },
  gardener: {
    id: "gardener",
    name: "FLOWER KEEPER",
    role: "GARDENER",
    message: "꽃은 한 칸씩 자라. 너도 한 사이클씩 가면 충분해.",
    options: ["25분 집중 시작", "짧은 산책 메모", "완료한 일 체크"],
    portrait: "gardener",
  },
  scribe: {
    id: "scribe",
    name: "NOTE BOOTH",
    role: "SCRIBE",
    message: "생각이 많을 땐 종이에 내려놓자. 한 줄이면 시작이야.",
    options: ["아이디어 적기", "우선순위 고르기", "내일로 넘기기"],
    portrait: "scribe",
  },
  hall: {
    id: "hall",
    name: "몽글 이장님의 집",
    role: "CHIEF",
    message: "어서 와요. 몽글마을의 오늘을 같이 정리해볼까요?",
    options: ["TODO 생성", "플래너 챗봇", "새로운 주민 생성"],
    portrait: "chef",
  },
  bakery: {
    id: "bakery",
    name: "BAKERY",
    role: "SHOP",
    message: "고소한 빵 냄새가 난다. 쉬는 시간 보상으로 딱 좋아.",
    options: ["휴식 예약", "간식 메모", "다시 집중하기"],
    portrait: "chef",
  },
  cottage: {
    id: "cottage",
    name: "COZY CABIN",
    role: "HOME",
    message: "작은 집 앞 길이 조용하다. 오늘 할 일을 하나만 골라보자.",
    options: ["가장 쉬운 일", "가장 중요한 일", "미룬 일 하나"],
    portrait: "gardener",
  },
  library: {
    id: "library",
    name: "MINI LIBRARY",
    role: "BOOKS",
    message: "책장 사이로 조용한 시간이 흐른다. 기록하기 좋은 장소야.",
    options: ["학습 TODO", "읽을거리 정리", "메모 열기"],
    portrait: "scribe",
  },
};

const STORAGE_KEY = "pixel-village-focus.todos";
const APP_STATE_KEY = "mongle-village.product-state";

const residentsSeed: Resident[] = [
  {
    id: "chef",
    name: "다온",
    persona: "따뜻한 식탁처럼 오늘의 루틴을 챙겨주는 주민",
    speech: "작게 나누면 금방 해낼 수 있어.",
    portrait: "chef",
  },
  {
    id: "gardener",
    name: "하루",
    persona: "꽃과 산책을 좋아하는 부지런한 정원사",
    speech: "한 칸씩 자라면 충분해.",
    portrait: "gardener",
  },
  {
    id: "scribe",
    name: "소담",
    persona: "메모와 계획을 정리하는 차분한 기록가",
    speech: "흩어진 생각을 목록으로 묶어볼게.",
    portrait: "scribe",
  },
];

const questLines = [
  "마을 우체통 앞에서 반짝이는 편지를 정리하기",
  "숲길 표지판에 오늘의 응원 문장을 새기기",
  "작은 우물가에 별빛 물방울을 모아두기",
  "빵집 굴뚝 연기처럼 포근한 기운을 나누기",
  "꽃밭 사이를 걸으며 조용한 행운을 찾기",
];

let productState = readProductState();

const TINY = {
  grass: 0,
  flowerGrass: 13,
  pineA: 2,
  pineB: 3,
  treeA: 8,
  treeB: 10,
  dirt: 12,
  blueRoofLeft: 24,
  blueRoofMid: 25,
  blueRoofRight: 26,
  redRoofLeft: 27,
  redRoofMid: 28,
  redRoofRight: 29,
  blueWallLeft: 36,
  blueWallMid: 37,
  blueWallRight: 38,
  redWallLeft: 39,
  redWallMid: 40,
  redWallRight: 41,
  fenceH: 55,
  fenceV: 67,
  well: 57,
  barrel: 58,
  crate: 59,
  lamp: 68,
  sign: 70,
  rock: 69,
};

let selectedEntity: VillageEntity = entities.hall;

class VillageScene extends Phaser.Scene {
  private readonly tileSize = 16;
  private readonly mapWidth = 58;
  private readonly mapHeight = 34;

  constructor() {
    super("VillageScene");
  }

  preload() {
    this.load.spritesheet("kenney", "/assets/kenney/Spritesheet/roguelikeSheet_transparent.png", {
      frameWidth: 16,
      frameHeight: 16,
      spacing: 1,
    });
    this.load.spritesheet("tiny-town", "/assets/kenney-tiny-town/Tilemap/tilemap_packed.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.image("ref-grass", "/assets/reference-village/sprites/tile_grass.png");
    this.load.image("ref-grass-dark", "/assets/reference-village/sprites/tile_grass_dark.png");
    this.load.image("ref-path", "/assets/reference-village/sprites/tile_path.png");
    this.load.image("ref-water", "/assets/reference-village/sprites/tile_water.png");
    this.load.image("ref-tree-oak", "/assets/reference-village/sprites/tree_oak.png");
    this.load.image("ref-tree-pine", "/assets/reference-village/sprites/tree_pine.png");
    this.load.image("ref-house-red", "/assets/reference-village/sprites/house_red.png");
    this.load.image("ref-house-brown", "/assets/reference-village/sprites/house_brown.png");
    this.load.image("ref-bush", "/assets/reference-village/sprites/bush.png");
    this.load.image("ref-flower-pink", "/assets/reference-village/sprites/flower_pink.png");
    this.load.image("ref-flower-white", "/assets/reference-village/sprites/flower_white.png");
    this.load.image("ref-flower-yellow", "/assets/reference-village/sprites/flower_yellow.png");
    this.load.spritesheet("ref-chicken", "/assets/reference-village/sprites/chicken_sheet.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet("ref-chief", "/assets/reference-village/sprites/chief_sheet.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    this.cameras.main.setBackgroundColor("#173522");
    this.createTextures();
    this.createReferenceAnimations();
    this.drawVillage();
    this.createInteractiveEntities();
    this.events.emit("entity-selected", selectedEntity);
  }

  private createReferenceAnimations() {
    this.anims.create({
      key: "chicken-peck",
      frames: this.anims.generateFrameNumbers("ref-chicken", { start: 0, end: 1 }),
      frameRate: 2,
      repeat: -1,
    });
    this.anims.create({
      key: "chief-idle",
      frames: this.anims.generateFrameNumbers("ref-chief", { start: 0, end: 2 }),
      frameRate: 3,
      repeat: -1,
    });
  }

  private createTextures() {
    this.makeTile("grass-a", ["5eae4b", "73c05d", "4f9843", "88ce6d", "3e7c38"], 34);
    this.makeTile("grass-b", ["539f48", "6bb65a", "467f3e", "7dc565", "356d35"], 30);
    this.makeTile("grass-dark", ["2e6b3d", "367943", "245734", "43894c"], 28);
    this.makeTile("path", ["c88f56", "dfb977", "b97d48", "ecd092", "9e673d"], 30);
    this.makeTile("forest", ["1d5b36", "277444", "143d2b", "398a51", "0f3025"], 32);
    this.makeTile("shadow", ["243226", "2d3b2d", "1a271d"], 14);
    this.makeTile("water", ["3c8fb2", "57b6d5", "2d6f91", "a3e6e6"], 18);
    this.makeTile("cliff", ["6d5540", "876848", "4d3a2e", "aa8259"], 20);
    this.makeHouse("house-red", "#7e211f", "#c03a2e", "#e65b43", "#6b432c");
    this.makeHouse("house-brown", "#68452c", "#a87542", "#d3a05c", "#5a3728");
    this.makeTree("tree-a", "#174e32", "#277243", "#6fa34f");
    this.makeTree("tree-b", "#1b5740", "#2f774a", "#88a95f");
    this.makeBench();
    this.makeSign();
    this.makeWell();
    this.makeCrate();
    this.makeFence("fence-h", true);
    this.makeFence("fence-v", false);
    this.makeLamp();
    this.makeShrub();
    this.makeRock();
    this.makeFlower("flower-blue", "#b8e6ff", "#4f98cf");
    this.makeFlower("flower-purple", "#d0a2ff", "#7e58b8");
    this.makeFlower("flower-white", "#fff4cf", "#d7d1a2");
    this.makeNpc("npc-chef", "#f4d5b3", "#f7f2d2", "#63884a", "#5b4735");
    this.makeNpc("npc-gardener", "#efc49e", "#d98468", "#6d9c55", "#6b3b2a");
    this.makeNpc("npc-scribe", "#ecc49e", "#c6d3e8", "#8d6c45", "#3d4052");
  }

  private drawVillage() {
    for (let y = 0; y < this.mapHeight; y += 1) {
      for (let x = 0; x < this.mapWidth; x += 1) {
        const edge = x < 4 || y < 3 || x > this.mapWidth - 5 || y > this.mapHeight - 4;
        const key = edge ? "forest" : "grass-a";
        this.add.image(x * this.tileSize, y * this.tileSize, key).setOrigin(0);
        this.placeReferenceTile(x, y, edge || (x + y) % 9 === 0 ? "ref-grass-dark" : "ref-grass", 0);
        if (!edge) {
          const frame = (x + y) % 11 === 0 ? TINY.flowerGrass : TINY.grass;
          this.placeTinyCell(x, y, frame, 0);
        }
      }
    }

    this.drawWaterfallCorner();
    this.drawPath();
    this.scatterForest();
    this.scatterDecor();
    this.drawReferenceNeighborhood();
    this.createWanderingChickens();

    this.placeTinyCell(15, 16, TINY.barrel, 160);
    this.placeTinyCell(34, 23, TINY.well, 230);
    this.placeTinyCell(49, 7, TINY.crate, 70);
    this.placeTinyCell(22, 23, TINY.sign, 230);
    this.placeImage(14, 7, "kenney", 1, 23);
    this.placeImage(4, 18, "kenney", 1, 466);
  }

  private drawPath() {
    const cells: Array<[number, number]> = [];
    for (let x = 4; x < this.mapWidth - 4; x += 1) cells.push([x, 18], [x, 19]);
    for (let y = 3; y < this.mapHeight - 3; y += 1) cells.push([30, y], [31, y]);
    for (let x = 7; x < 19; x += 1) cells.push([x, 23]);
    for (let y = 19; y < 31; y += 1) cells.push([11, y]);
    for (let y = 19; y < 29; y += 1) cells.push([47, y]);
    for (let x = 37; x < 49; x += 1) cells.push([x, 25]);

    cells.forEach(([x, y]) => {
      this.add.image(x * this.tileSize, y * this.tileSize, "path").setOrigin(0);
      this.placeReferenceTile(x, y, "ref-path", 2);
      this.placeTinyCell(x, y, TINY.dirt, 1);
    });

    cells.forEach(([x, y], i) => {
      if (i % 7 === 0) this.placeTinyCell(x, y, TINY.rock, y * 10 + 2);
    });
  }

  private drawWaterfallCorner() {
    for (let y = 4; y < 13; y += 1) {
      for (let x = 4; x < 10; x += 1) {
        this.add.image(x * this.tileSize, y * this.tileSize, x === 9 ? "cliff" : "water").setOrigin(0);
        if (x < 9) this.placeReferenceTile(x, y, "ref-water", 3);
      }
    }

    for (let y = 3; y < 14; y += 1) {
      this.add.image(10 * this.tileSize, y * this.tileSize, "cliff").setOrigin(0);
    }
    for (let x = 4; x < 11; x += 1) {
      this.add.image(x * this.tileSize, 13 * this.tileSize, "cliff").setOrigin(0);
    }
  }

  private scatterForest() {
    const positions = [
      [5, 4], [7, 3], [10, 5], [18, 3], [21, 4], [36, 3], [39, 5], [44, 4], [51, 5],
      [3, 9], [5, 12], [53, 11], [55, 15], [4, 27], [7, 29], [19, 30], [37, 29], [52, 28],
      [2, 21], [12, 31], [17, 4], [28, 3], [33, 31], [41, 30], [55, 27],
    ];
    positions.forEach(([x, y], i) => {
      this.placeImage(x, y, i % 2 ? "tree-b" : "tree-a", 0.9);
      this.placeReferenceSprite(x, y + 1, i % 2 ? "ref-tree-pine" : "ref-tree-oak", i % 2 ? 0.72 : 0.78);
      this.placeTinyCell(x + 1, y - 2, i % 2 ? TINY.pineB : TINY.treeA, y * 10 + 1);
      this.placeTinyCell(x + 2, y - 1, i % 3 ? TINY.pineA : TINY.treeB, y * 10 + 2);
    });
  }

  private scatterDecor() {
    const flowers = ["flower-blue", "flower-purple", "flower-white"];
    const positions = [
      [18, 13], [20, 16], [25, 24], [28, 22], [34, 16], [40, 17], [46, 15], [51, 13],
      [16, 24], [18, 27], [35, 27], [39, 28], [45, 30], [9, 14], [12, 11], [52, 23],
      [24, 7], [33, 7], [42, 8],
      [6, 16], [7, 17], [8, 16], [23, 14], [27, 15], [36, 21], [38, 20], [41, 18],
      [50, 25], [52, 24], [54, 21], [29, 28], [31, 29],
    ];
    positions.forEach(([x, y], i) => {
      this.placeImage(x, y, flowers[i % flowers.length], 1);
      this.placeReferenceSprite(
        x + 0.35,
        y + 0.85,
        ["ref-flower-pink", "ref-flower-white", "ref-flower-yellow"][i % 3],
        1,
      );
      if (i % 2 === 0) this.placeTinyCell(x, y, TINY.flowerGrass, y * 10);
    });

    const fencesH = [[18, 24], [19, 24], [20, 24], [21, 24], [41, 8], [42, 8], [43, 8], [48, 27], [49, 27], [50, 27]];
    const fencesV = [[17, 24], [17, 25], [22, 24], [22, 25], [47, 27], [51, 27], [51, 28]];
    fencesH.forEach(([x, y]) => this.placeTinyCell(x, y, TINY.fenceH, y * 10));
    fencesV.forEach(([x, y]) => this.placeTinyCell(x, y, TINY.fenceV, y * 10));

    const props: Array<[number, number, string, number]> = [
      [12, 21, "lamp", TINY.lamp], [33, 11, "lamp", TINY.lamp], [45, 17, "lamp", TINY.lamp], [50, 10, "crate", TINY.crate],
      [24, 26, "shrub", TINY.treeA], [25, 26, "shrub", TINY.pineA], [14, 12, "shrub", TINY.treeB], [46, 12, "shrub", TINY.pineB],
      [19, 7, "rock", TINY.rock], [28, 25, "rock", TINY.rock], [53, 16, "rock", TINY.rock],
    ];
    props.forEach(([x, y, key, frame]) => {
      this.placeImage(x, y, key, 0.85);
      if (key === "shrub") this.placeReferenceSprite(x, y + 0.6, "ref-bush", 0.85);
      this.placeTinyCell(x, y, frame, y * 10 + 1);
    });
  }

  private drawReferenceNeighborhood() {
    this.drawReferenceHouse(9, 20, "ref-house-red");
    this.drawReferenceHouse(23, 10, "ref-house-brown");
    this.drawReferenceHouse(36, 10, "ref-house-red");
    this.drawReferenceHouse(43, 22, "ref-house-brown");
    this.drawReferenceHouse(48, 19, "ref-house-red");
    const chief = this.add.sprite(30 * this.tileSize, 17 * this.tileSize, "ref-chief", 0).setOrigin(0.5, 1).setScale(1.15);
    chief.play("chief-idle");
    chief.setDepth(180);
  }

  private drawReferenceHouse(x: number, y: number, key: string) {
    const shadow = this.add.ellipse((x + 1.7) * this.tileSize, (y + 2.35) * this.tileSize, 58, 18, 0x2a2118, 0.36);
    shadow.setDepth((y + 3) * 10 - 2);
    this.placeReferenceSprite(x + 1.55, y + 2.95, key, 0.72);
    this.placeTinyCell(x - 1, y + 2, TINY.crate, (y + 2) * 10 + 5);
    this.placeTinyCell(x + 3, y + 2, TINY.barrel, (y + 2) * 10 + 5);
  }

  private createWanderingChickens() {
    const chickens: Array<[number, number, number, number]> = [
      [17, 18, 24, 18],
      [27, 14, 33, 15],
      [39, 20, 45, 20],
      [51, 26, 45, 27],
      [20, 28, 14, 27],
    ];
    chickens.forEach(([x1, y1, x2, y2], index) => {
      const chicken = this.add.sprite(x1 * this.tileSize, y1 * this.tileSize, "ref-chicken", 0).setOrigin(0.5, 1).setScale(1.1);
      chicken.play("chicken-peck");
      chicken.setDepth(y1 * 10 + 9);
      this.tweens.add({
        targets: chicken,
        x: x2 * this.tileSize,
        y: y2 * this.tileSize,
        duration: 5200 + index * 650,
        delay: index * 280,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        onYoyo: () => chicken.setFlipX(!chicken.flipX),
        onRepeat: () => chicken.setFlipX(!chicken.flipX),
      });
    });
  }

  private createInteractiveEntities() {
    const buildingSpots: Array<[EntityKind, number, number, number, number]> = [
      ["hall", 30, 16, 52, 48],
      ["bakery", 38, 14, 52, 48],
      ["cottage", 49, 21, 52, 48],
      ["library", 44, 23, 52, 48],
    ];
    buildingSpots.forEach(([id, x, y, width, height]) => {
      const entity = entities[id];
      const zone = this.add.zone(x * this.tileSize, y * this.tileSize, width, height).setOrigin(0.5, 1);
      zone.setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => this.selectEntity(entity, zone));
      zone.on("pointerover", () => this.addHoverMarker(zone.x, zone.y - height + 8));
      zone.on("pointerout", () => this.clearHoverMarker());
    });

    const spots: Array<[EntityKind, number, number, string, number]> = [
      ["chef", 35, 17, "npc-chef", 1],
      ["gardener", 13, 14, "npc-gardener", 1],
      ["scribe", 20, 25, "npc-scribe", 1],
    ];

    spots.forEach(([id, x, y, texture, scale]) => {
      const entity = entities[id];
      const sprite = this.add.image(x * this.tileSize, y * this.tileSize, texture).setOrigin(0.5, 1).setScale(scale);
      sprite.setInteractive({ useHandCursor: true });
      sprite.on("pointerdown", () => this.selectEntity(entity, sprite));
      sprite.on("pointerover", () => sprite.setTint(0xfff0b5));
      sprite.on("pointerout", () => sprite.clearTint());
    });
  }

  private selectEntity(entity: VillageEntity, sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Zone) {
    selectedEntity = entity;
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 5,
      yoyo: true,
      duration: 110,
      ease: "Sine.easeOut",
    });
    this.events.emit("entity-selected", entity);
  }

  private hoverMarker?: Phaser.GameObjects.Rectangle;

  private addHoverMarker(x: number, y: number) {
    this.clearHoverMarker();
    this.hoverMarker = this.add.rectangle(x, y, 48, 4, 0xfff0b5, 0.75);
    this.hoverMarker.setDepth(10000);
  }

  private clearHoverMarker() {
    this.hoverMarker?.destroy();
    this.hoverMarker = undefined;
  }

  private placeTinyCell(x: number, y: number, frame: number, depth = y * 10) {
    const image = this.add.image(x * this.tileSize, y * this.tileSize, "tiny-town", frame).setOrigin(0);
    image.setPipeline("TextureTintPipeline");
    image.setDepth(depth);
    return image;
  }

  private placeReferenceTile(x: number, y: number, key: string, depth = y * 10) {
    const image = this.add.image(x * this.tileSize, y * this.tileSize, key).setOrigin(0).setScale(0.5);
    image.setPipeline("TextureTintPipeline");
    image.setDepth(depth);
    return image;
  }

  private placeReferenceSprite(x: number, y: number, key: string, scale = 1) {
    const image = this.add.image(x * this.tileSize, y * this.tileSize, key).setOrigin(0.5, 1).setScale(scale);
    image.setPipeline("TextureTintPipeline");
    image.setDepth(y * 10 + 8);
    return image;
  }

  private placeImage(x: number, y: number, texture: string, scale = 1, frame?: number) {
    const image = this.add.image(x * this.tileSize, y * this.tileSize, texture, frame).setOrigin(0, 1).setScale(scale);
    image.setPipeline("TextureTintPipeline");
    image.setDepth(y * 10);
    return image;
  }

  private makeTile(key: string, palette: string[], count: number) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(`#${palette[0]}`).color, 1);
    g.fillRect(0, 0, 16, 16);
    for (let i = 0; i < count; i += 1) {
      const color = Phaser.Display.Color.HexStringToColor(`#${palette[i % palette.length]}`).color;
      g.fillStyle(color, 1);
      g.fillRect((i * 5 + 3) % 16, (i * 7 + 2) % 16, i % 3 === 0 ? 2 : 1, 1);
    }
    g.generateTexture(key, 16, 16);
    g.destroy();
  }

  private makeHouse(key: string, roofDark: string, roofMid: string, roofLight: string, wall: string) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const dark = Phaser.Display.Color.HexStringToColor(roofDark).color;
    const mid = Phaser.Display.Color.HexStringToColor(roofMid).color;
    const light = Phaser.Display.Color.HexStringToColor(roofLight).color;
    const wallColor = Phaser.Display.Color.HexStringToColor(wall).color;

    g.fillStyle(0x1b1d17, 0.32);
    g.fillRect(7, 43, 66, 9);
    g.fillStyle(0x3c2922, 1);
    g.fillRect(11, 25, 56, 22);
    g.fillStyle(wallColor, 1);
    g.fillRect(14, 25, 50, 20);
    g.fillStyle(0x8f6745, 1);
    for (let x = 18; x < 61; x += 11) g.fillRect(x, 27, 2, 17);

    g.fillStyle(0x2c2020, 1);
    g.fillTriangle(4, 27, 39, 3, 75, 27);
    g.fillRect(10, 24, 59, 5);
    g.fillStyle(dark, 1);
    g.fillTriangle(8, 26, 39, 6, 71, 26);
    g.fillRect(13, 22, 53, 6);
    g.fillStyle(mid, 1);
    for (let x = 14; x < 66; x += 8) {
      g.fillRect(x, 22 - Math.floor((x - 14) / 16), 5, 11);
    }
    g.fillStyle(light, 1);
    g.fillRect(24, 17, 5, 12);
    g.fillRect(42, 12, 5, 17);
    g.fillRect(59, 21, 4, 8);
    g.fillStyle(0x5b3326, 1);
    g.fillRect(53, 8, 9, 14);
    g.fillStyle(0xc8844f, 1);
    g.fillRect(55, 7, 6, 5);

    g.fillStyle(0x2f2430, 1);
    g.fillRect(34, 33, 11, 14);
    g.fillStyle(0x5d4732, 1);
    g.fillRect(36, 35, 7, 12);
    g.fillStyle(0xf8d886, 1);
    g.fillRect(19, 31, 11, 8);
    g.fillRect(51, 31, 10, 8);
    g.fillStyle(0x5f432d, 1);
    g.fillRect(22, 31, 2, 8);
    g.fillRect(54, 31, 2, 8);
    g.fillRect(19, 35, 11, 2);
    g.fillRect(51, 35, 10, 2);
    g.generateTexture(key, 80, 54);
    g.destroy();
  }

  private makeTree(key: string, leafDark: string, leafMid: string, leafLight: string) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const dark = Phaser.Display.Color.HexStringToColor(leafDark).color;
    const mid = Phaser.Display.Color.HexStringToColor(leafMid).color;
    const light = Phaser.Display.Color.HexStringToColor(leafLight).color;

    g.fillStyle(0x1a2219, 0.34);
    g.fillRect(5, 38, 34, 7);
    g.fillStyle(0x5c3526, 1);
    g.fillRect(18, 24, 8, 18);
    g.fillStyle(0x7a4b2d, 1);
    g.fillRect(20, 27, 4, 13);

    g.fillStyle(dark, 1);
    g.fillRect(8, 12, 28, 23);
    g.fillRect(12, 5, 22, 17);
    g.fillRect(3, 19, 13, 14);
    g.fillRect(31, 19, 10, 13);
    g.fillStyle(mid, 1);
    g.fillRect(11, 10, 13, 10);
    g.fillRect(21, 7, 10, 14);
    g.fillRect(15, 22, 18, 11);
    g.fillRect(6, 23, 8, 7);
    g.fillStyle(light, 1);
    g.fillRect(15, 9, 6, 5);
    g.fillRect(26, 12, 5, 6);
    g.fillRect(19, 24, 7, 4);
    g.fillStyle(0x0e2f22, 1);
    g.fillRect(5, 29, 8, 5);
    g.fillRect(33, 27, 6, 5);
    g.generateTexture(key, 44, 46);
    g.destroy();
  }

  private makeBench() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x4f2d24, 1);
    g.fillRect(4, 9, 44, 4);
    g.fillRect(4, 17, 44, 5);
    g.fillStyle(0xc48147, 1);
    g.fillRect(6, 8, 40, 3);
    g.fillRect(6, 16, 40, 3);
    g.fillStyle(0x3a2520, 1);
    g.fillRect(9, 21, 4, 8);
    g.fillRect(38, 21, 4, 8);
    g.generateTexture("bench", 52, 30);
    g.destroy();
  }

  private makeSign() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x5b392a, 1);
    g.fillRect(7, 12, 4, 15);
    g.fillStyle(0xb88452, 1);
    g.fillRect(1, 2, 17, 11);
    g.fillStyle(0x3b2a24, 1);
    g.fillRect(4, 5, 10, 2);
    g.generateTexture("sign", 20, 28);
    g.destroy();
  }

  private makeWell() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x392824, 1);
    g.fillRect(4, 12, 30, 16);
    g.fillStyle(0xb88558, 1);
    g.fillRect(7, 14, 24, 11);
    g.fillStyle(0x6e3930, 1);
    g.fillTriangle(2, 13, 19, 2, 36, 13);
    g.fillStyle(0xd55442, 1);
    g.fillRect(10, 9, 18, 4);
    g.generateTexture("well", 38, 30);
    g.destroy();
  }

  private makeCrate() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x6b4934, 1);
    g.fillRect(0, 0, 32, 31);
    g.fillStyle(0xb97943, 1);
    g.fillRect(3, 3, 26, 25);
    g.fillStyle(0x4f3428, 1);
    g.fillRect(3, 13, 26, 3);
    g.fillRect(14, 3, 3, 25);
    g.generateTexture("crate", 32, 31);
    g.destroy();
  }

  private makeFence(key: string, horizontal: boolean) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x4c3025, 1);
    if (horizontal) {
      g.fillRect(0, 8, 16, 4);
      g.fillRect(0, 15, 16, 4);
      g.fillStyle(0xb07942, 1);
      g.fillRect(1, 7, 14, 3);
      g.fillRect(1, 14, 14, 3);
      g.fillStyle(0x6b4430, 1);
      g.fillRect(2, 5, 3, 17);
      g.fillRect(11, 5, 3, 17);
    } else {
      g.fillRect(6, 1, 5, 28);
      g.fillStyle(0xb07942, 1);
      g.fillRect(7, 2, 3, 25);
      g.fillStyle(0x4c3025, 1);
      g.fillRect(2, 8, 12, 4);
      g.fillRect(2, 17, 12, 4);
    }
    g.generateTexture(key, 16, 30);
    g.destroy();
  }

  private makeLamp() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x32251e, 1);
    g.fillRect(7, 10, 3, 20);
    g.fillRect(4, 29, 9, 3);
    g.fillStyle(0xf4c45c, 1);
    g.fillRect(4, 3, 9, 8);
    g.fillStyle(0xffe89c, 1);
    g.fillRect(6, 5, 5, 4);
    g.fillStyle(0x5f3b2a, 1);
    g.fillRect(3, 1, 11, 3);
    g.generateTexture("lamp", 18, 32);
    g.destroy();
  }

  private makeShrub() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x1f5f3a, 1);
    g.fillRect(2, 7, 14, 8);
    g.fillRect(5, 4, 10, 8);
    g.fillStyle(0x3c8c4d, 1);
    g.fillRect(5, 6, 5, 4);
    g.fillRect(12, 9, 3, 3);
    g.fillStyle(0x7fc461, 1);
    g.fillRect(8, 5, 3, 2);
    g.generateTexture("shrub", 18, 16);
    g.destroy();
  }

  private makeRock() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x35423f, 0.25);
    g.fillRect(3, 10, 11, 3);
    g.fillStyle(0x8d9588, 1);
    g.fillRect(4, 5, 9, 6);
    g.fillStyle(0xb9c1ae, 1);
    g.fillRect(5, 4, 5, 3);
    g.fillStyle(0x5f6d64, 1);
    g.fillRect(10, 8, 3, 3);
    g.generateTexture("rock", 16, 14);
    g.destroy();
  }

  private makeFlower(key: string, petal: string, shade: string) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x2c6f3c, 1);
    g.fillRect(7, 8, 2, 7);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(shade).color, 1);
    g.fillRect(4, 5, 8, 6);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(petal).color, 1);
    g.fillRect(6, 3, 4, 10);
    g.fillRect(3, 6, 10, 4);
    g.fillStyle(0xffd36b, 1);
    g.fillRect(7, 7, 2, 2);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }

  private makeNpc(key: string, skin: string, shirt: string, pants: string, hair: string) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x1c241f, 0.25);
    g.fillRect(5, 28, 13, 3);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(pants).color, 1);
    g.fillRect(7, 20, 4, 9);
    g.fillRect(13, 20, 4, 9);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(shirt).color, 1);
    g.fillRect(6, 12, 12, 10);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(skin).color, 1);
    g.fillRect(7, 5, 10, 9);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(hair).color, 1);
    g.fillRect(6, 3, 12, 5);
    g.fillStyle(0x2d2523, 1);
    g.fillRect(9, 9, 2, 2);
    g.fillRect(14, 9, 2, 2);
    g.generateTexture(key, 24, 32);
    g.destroy();
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 928,
  height: 544,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: "#203d2a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: false,
    pixelArt: true,
  },
  scene: [VillageScene],
});

const sceneReady = () =>
  new Promise<VillageScene>((resolve) => {
    game.events.once(Phaser.Core.Events.READY, () => {
      resolve(game.scene.getScene("VillageScene") as VillageScene);
    });
  });

const timerEl = document.querySelector<HTMLParagraphElement>("#timer")!;
const cycleEl = document.querySelector<HTMLParagraphElement>("#cycle-label")!;
const startBtn = document.querySelector<HTMLButtonElement>("#start-btn")!;
const resetBtn = document.querySelector<HTMLButtonElement>("#reset-btn")!;
const addTodoBtn = document.querySelector<HTMLButtonElement>("#add-todo-btn")!;
const aiTodoBtn = document.querySelector<HTMLButtonElement>("#ai-todo-btn")!;
const dateLabel = document.querySelector<HTMLParagraphElement>("#date-label")!;
const weekdayLabel = document.querySelector<HTMLHeadingElement>("#weekday-label")!;
const todoForm = document.querySelector<HTMLFormElement>("#todo-form")!;
const todoInput = document.querySelector<HTMLInputElement>("#todo-input")!;
const todoList = document.querySelector<HTMLUListElement>("#todo-list")!;
const todoStatus = document.querySelector<HTMLParagraphElement>("#todo-status")!;
const appleCount = document.querySelector<HTMLElement>("#apple-count")!;
const residentCount = document.querySelector<HTMLElement>("#resident-count")!;
const questQuota = document.querySelector<HTMLElement>("#quest-quota")!;
const residentList = document.querySelector<HTMLDivElement>("#resident-list")!;
const newCharacterBtn = document.querySelector<HTMLButtonElement>("#new-character-btn")!;
const characterLimit = document.querySelector<HTMLParagraphElement>("#character-limit")!;
const questTab = document.querySelector<HTMLButtonElement>("#quest-tab")!;
const feedTab = document.querySelector<HTMLButtonElement>("#feed-tab")!;
const retroTab = document.querySelector<HTMLButtonElement>("#retro-tab")!;
const questView = document.querySelector<HTMLDivElement>("#quest-view")!;
const feedView = document.querySelector<HTMLDivElement>("#feed-view")!;
const retroView = document.querySelector<HTMLDivElement>("#retro-view")!;
const questList = document.querySelector<HTMLUListElement>("#quest-list")!;
const feedList = document.querySelector<HTMLDivElement>("#feed-list")!;
const goodPoints = document.querySelector<HTMLTextAreaElement>("#good-points")!;
const improvePoints = document.querySelector<HTMLTextAreaElement>("#improve-points")!;
const saveReflectionBtn = document.querySelector<HTMLButtonElement>("#save-reflection-btn")!;
const reflectionStatus = document.querySelector<HTMLParagraphElement>("#reflection-status")!;
const entityCard = document.querySelector<HTMLElement>("#entity-card")!;
const entityPortrait = document.querySelector<HTMLElement>("#entity-portrait")!;
const entityTitle = document.querySelector<HTMLHeadingElement>("#entity-title")!;
const dialoguePortrait = document.querySelector<HTMLElement>("#dialogue-portrait")!;
const dialogueText = document.querySelector<HTMLParagraphElement>("#dialogue-text")!;
const dialogueOptions = document.querySelector<HTMLDivElement>("#dialogue-options")!;
const closeDialogue = document.querySelector<HTMLButtonElement>("#close-dialogue")!;
const featureModal = document.querySelector<HTMLElement>("#feature-modal")!;
const modalClose = document.querySelector<HTMLButtonElement>("#modal-close")!;
const modalLabel = document.querySelector<HTMLParagraphElement>("#modal-label")!;
const modalTitle = document.querySelector<HTMLHeadingElement>("#modal-title")!;
const todoCreateView = document.querySelector<HTMLDivElement>("#todo-create-view")!;
const plannerView = document.querySelector<HTMLDivElement>("#planner-view")!;
const characterCreateView = document.querySelector<HTMLDivElement>("#character-create-view")!;
const todoAiPrompt = document.querySelector<HTMLTextAreaElement>("#todo-ai-prompt")!;
const todoAiSubmit = document.querySelector<HTMLButtonElement>("#todo-ai-submit")!;
const todoAiResult = document.querySelector<HTMLDivElement>("#todo-ai-result")!;
const plannerHistory = document.querySelector<HTMLDivElement>("#planner-history")!;
const plannerMessage = document.querySelector<HTMLTextAreaElement>("#planner-message")!;
const plannerSubmit = document.querySelector<HTMLButtonElement>("#planner-submit")!;
const characterName = document.querySelector<HTMLInputElement>("#character-name")!;
const characterPersona = document.querySelector<HTMLTextAreaElement>("#character-persona")!;
const characterSubmit = document.querySelector<HTMLButtonElement>("#character-submit")!;
const characterResult = document.querySelector<HTMLParagraphElement>("#character-result")!;

let remainingSeconds = 25 * 60;
let cycles = 0;
let timerId: number | undefined;
let running = false;
let todos: Todo[] = readTodos();
let aiTodoRunning = false;
let plannerMessages: Array<{ role: "user" | "chief"; text: string }> = [];

const AI_API_URL = (import.meta.env.VITE_MONGLE_API_URL || "http://127.0.0.1:8010").replace(/\/$/, "");

function readTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [{ id: crypto.randomUUID(), title: "포커스 타이머 한 번 켜기", completed: false, createdAt: Date.now() }];
  try {
    return JSON.parse(raw) as Todo[];
  } catch {
    return [];
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readProductState(): {
  apples: number;
  residents: Resident[];
  quests: Quest[];
  feed: FeedPost[];
  dailyQuestCount: number;
  imageGenCount: number;
  reflectionDate: string | null;
} {
  const raw = localStorage.getItem(APP_STATE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        apples: parsed.apples ?? 5,
        residents: parsed.residents?.length ? parsed.residents : residentsSeed,
        quests: parsed.quests ?? [],
        feed: parsed.feed ?? [],
        dailyQuestCount: parsed.dailyQuestCount ?? 0,
        imageGenCount: parsed.imageGenCount ?? 0,
        reflectionDate: parsed.reflectionDate ?? null,
      };
    } catch {
      // Fall through to seed state.
    }
  }
  return {
    apples: 5,
    residents: residentsSeed,
    quests: [],
    feed: [],
    dailyQuestCount: 0,
    imageGenCount: 0,
    reflectionDate: null,
  };
}

function saveProductState() {
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(productState));
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function renderTimer() {
  timerEl.textContent = formatTime(remainingSeconds);
  cycleEl.textContent = `${cycles} CYCLES`;
  startBtn.textContent = running ? "PAUSE" : "START";
}

function renderDate() {
  const now = new Date();
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  dateLabel.textContent = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  weekdayLabel.textContent = weekdays[now.getDay()];
}

function tick() {
  if (remainingSeconds <= 0) {
    cycles += 1;
    remainingSeconds = 5 * 60;
    stopTimer();
    renderTimer();
    updateEntity(entities.gardener);
    return;
  }
  remainingSeconds -= 1;
  renderTimer();
}

function startTimer() {
  running = true;
  timerId = window.setInterval(tick, 1000);
  renderTimer();
}

function stopTimer() {
  running = false;
  if (timerId) window.clearInterval(timerId);
  timerId = undefined;
  renderTimer();
}

function resetTimer() {
  stopTimer();
  remainingSeconds = 25 * 60;
  renderTimer();
}

function renderTodos() {
  todoList.innerHTML = "";
  todos.slice(0, 5).forEach((todo) => {
    const item = document.createElement("li");
    item.className = todo.completed ? "done" : "";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = todo.completed ? "✓" : "□";
    button.addEventListener("click", () => {
      const wasCompleted = todo.completed;
      todo.completed = !todo.completed;
      if (!wasCompleted && todo.completed) completeTodoFlow(todo);
      saveTodos();
      renderTodos();
      renderProductPanels();
    });
    const span = document.createElement("span");
    span.textContent = todo.title;
    item.append(button, span);
    todoList.append(item);
  });
}

function renderProductPanels() {
  appleCount.textContent = String(productState.apples);
  residentCount.textContent = `${productState.residents.length}/10`;
  questQuota.textContent = `${productState.dailyQuestCount}/5`;
  characterLimit.textContent = `생성 ${productState.imageGenCount}/3 · 보유 ${productState.residents.length}/10`;

  residentList.innerHTML = "";
  productState.residents.forEach((resident) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "resident-item";
    item.innerHTML = `<span class="mini-portrait ${resident.portrait}"></span><span><strong>${resident.name}</strong><em>${resident.speech}</em></span>`;
    item.addEventListener("click", () => {
      updateEntity({
        ...entities.scribe,
        name: resident.name,
        role: "CHARACTER",
        message: `${resident.persona}. "${resident.speech}"`,
        portrait: resident.portrait,
        options: ["퀘스트 보기", "피드 확인", "회고 쓰기"],
      });
      showTab("quest");
    });
    residentList.append(item);
  });

  questList.innerHTML = "";
  const quests = productState.quests.slice(0, 5);
  if (quests.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-row";
    empty.textContent = "오늘 확정된 퀘스트가 아직 없어요.";
    questList.append(empty);
  }
  quests.forEach((quest) => {
    const resident = productState.residents.find((item) => item.id === quest.characterId) || productState.residents[0];
    const item = document.createElement("li");
    item.className = quest.status === "COMPLETED" ? "done" : "";
    item.innerHTML = `<strong>${resident.name}</strong><span>${quest.text}</span><em>${quest.status}</em>`;
    questList.append(item);
  });

  feedList.innerHTML = "";
  const posts = productState.feed.slice(0, 4);
  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-row";
    empty.textContent = "완료된 퀘스트 피드가 아직 없어요.";
    feedList.append(empty);
  }
  posts.forEach((post) => {
    const resident = productState.residents.find((item) => item.id === post.characterId) || productState.residents[0];
    const card = document.createElement("article");
    card.className = "feed-card";
    card.innerHTML = `<div class="feed-image ${resident.portrait}"></div><div><strong>${resident.name}</strong><p>${post.caption}</p><button type="button">${post.liked ? "♥" : "♡"} 댓글 -3 사과</button></div>`;
    const button = card.querySelector("button")!;
    button.addEventListener("click", () => {
      if (!post.liked && productState.apples >= 3) {
        post.liked = true;
        productState.apples -= 3;
        saveProductState();
        renderProductPanels();
      }
    });
    feedList.append(card);
  });
}

function showTab(tab: "quest" | "feed" | "retro") {
  questTab.classList.toggle("is-active", tab === "quest");
  feedTab.classList.toggle("is-active", tab === "feed");
  retroTab.classList.toggle("is-active", tab === "retro");
  questView.classList.toggle("is-hidden", tab !== "quest");
  feedView.classList.toggle("is-hidden", tab !== "feed");
  retroView.classList.toggle("is-hidden", tab !== "retro");
}

function openFeatureModal(kind: "todo" | "planner" | "character") {
  featureModal.classList.remove("is-hidden");
  todoCreateView.classList.toggle("is-hidden", kind !== "todo");
  plannerView.classList.toggle("is-hidden", kind !== "planner");
  characterCreateView.classList.toggle("is-hidden", kind !== "character");

  if (kind === "todo") {
    modalLabel.textContent = "TODO AGENT";
    modalTitle.textContent = "TODO 생성";
    todoAiPrompt.focus();
  } else if (kind === "planner") {
    modalLabel.textContent = "MULTI-TURN PLANNER";
    modalTitle.textContent = "플래너 챗봇";
    renderPlannerHistory();
    plannerMessage.focus();
  } else {
    modalLabel.textContent = "CHARACTER GENERATION";
    modalTitle.textContent = "새로운 주민 생성";
    characterName.focus();
  }
}

function closeFeatureModal() {
  featureModal.classList.add("is-hidden");
}

function renderPlannerHistory() {
  plannerHistory.innerHTML = "";
  if (plannerMessages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-row";
    empty.textContent = "몽글 이장님에게 목표, 기한, 하루 가용 시간을 알려주세요.";
    plannerHistory.append(empty);
    return;
  }
  plannerMessages.forEach((message) => {
    const row = document.createElement("p");
    row.className = `planner-bubble ${message.role}`;
    row.textContent = `${message.role === "user" ? "나" : "이장"}: ${message.text}`;
    plannerHistory.append(row);
  });
}

function distributeQuestForTodo(todo: Todo) {
  if (productState.dailyQuestCount >= 5 || productState.residents.length === 0) return;
  if (productState.quests.some((quest) => quest.todoId === todo.id)) return;
  const resident = productState.residents[productState.dailyQuestCount % productState.residents.length];
  const text = questLines[productState.dailyQuestCount % questLines.length];
  productState.quests.unshift({
    id: crypto.randomUUID(),
    todoId: todo.id,
    characterId: resident.id,
    text,
    status: "PENDING",
  });
  productState.dailyQuestCount += 1;
  saveProductState();
}

function completeTodoFlow(todo: Todo) {
  productState.apples = Math.min(productState.apples + 1, 25);
  let quest = productState.quests.find((item) => item.todoId === todo.id);
  if (!quest) {
    distributeQuestForTodo(todo);
    quest = productState.quests.find((item) => item.todoId === todo.id);
  }
  if (quest) {
    quest.status = "COMPLETED";
    const resident = productState.residents.find((item) => item.id === quest.characterId) || productState.residents[0];
    if (!productState.feed.some((post) => post.questId === quest.id)) {
      productState.feed.unshift({
        id: crypto.randomUUID(),
        characterId: resident.id,
        questId: quest.id,
        caption: `${resident.name}: ${quest.text} 완료! 오늘의 작은 성취를 마을 피드에 남겨둘게.`,
        liked: false,
      });
    }
  }
  saveProductState();
}

function setTodoStatus(message: string) {
  todoStatus.textContent = message;
}

function addTodo(title: string) {
  const clean = title.trim();
  if (!clean) return;
  const todo = { id: crypto.randomUUID(), title: clean, completed: false, createdAt: Date.now() };
  todos.unshift(todo);
  todos = todos.slice(0, 8);
  distributeQuestForTodo(todo);
  saveTodos();
  saveProductState();
  renderTodos();
  renderProductPanels();
}

async function organizeTodosWithAi() {
  const prompt = todoInput.value.trim();
  if (!prompt || aiTodoRunning) return;

  aiTodoRunning = true;
  aiTodoBtn.disabled = true;
  setTodoStatus("AI가 할 일을 나누는 중...");
  try {
    const response = await fetch(`${AI_API_URL}/api/todos/split`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: "demo-user", prompt }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = (await response.json()) as {
      todos?: AiTodoCandidate[];
      calendar_events?: AiTodoCandidate[];
    };
    const candidates = [...(data.todos || []), ...(data.calendar_events || [])]
      .map((item) => item.title.trim())
      .filter(Boolean);
    if (candidates.length === 0) throw new Error("AI returned no candidates");
    candidates.forEach(addTodo);
    todoInput.value = "";
    setTodoStatus(`${candidates.length}개로 정리했어요.`);
    updateEntity({
      ...entities.scribe,
      message: "흩어진 말을 할 일 목록으로 정리했어. 이제 하나씩 체크하면 돼.",
    });
  } catch (error) {
    console.error(error);
    setTodoStatus("AI 서버를 확인해 주세요. 수동 추가는 계속 사용할 수 있어요.");
  } finally {
    aiTodoRunning = false;
    aiTodoBtn.disabled = false;
  }
}

function updateEntity(entity: VillageEntity) {
  entityCard.classList.add("is-visible");
  entityCard.querySelector(".card-role")!.textContent = entity.role;
  entityTitle.textContent = entity.name;
  entityPortrait.className = `portrait ${entity.portrait}`;
  dialoguePortrait.className = `dialogue-portrait ${entity.portrait}`;
  dialogueText.textContent = entity.message;
  dialogueOptions.innerHTML = "";
  entity.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = option;
    btn.addEventListener("click", () => {
      if (entity.id === "hall") {
        if (option === "TODO 생성") openFeatureModal("todo");
        else if (option === "플래너 챗봇") openFeatureModal("planner");
        else if (option === "새로운 주민 생성") openFeatureModal("character");
      } else {
        addTodo(option);
      }
    });
    dialogueOptions.append(btn);
  });
}

startBtn.addEventListener("click", () => {
  if (running) stopTimer();
  else startTimer();
});

resetBtn.addEventListener("click", resetTimer);

modalClose.addEventListener("click", closeFeatureModal);

todoAiSubmit.addEventListener("click", async () => {
  const prompt = todoAiPrompt.value.trim();
  if (!prompt) return;
  todoAiSubmit.disabled = true;
  todoAiResult.textContent = "TODO 에이전트가 후보를 생성하는 중...";
  try {
    const response = await fetch(`${AI_API_URL}/api/todos/split`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: "demo-user", prompt }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = (await response.json()) as { todos?: AiTodoCandidate[]; calendar_events?: AiTodoCandidate[] };
    const candidates = [...(data.todos || []), ...(data.calendar_events || [])];
    candidates.forEach((item) => addTodo(item.title));
    todoAiResult.innerHTML = candidates.map((item) => `<p>${item.due_date} · ${item.title}</p>`).join("");
    todoAiPrompt.value = "";
  } catch (error) {
    todoAiResult.textContent = `TODO 생성 실패: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    todoAiSubmit.disabled = false;
  }
});

plannerSubmit.addEventListener("click", async () => {
  const message = plannerMessage.value.trim();
  if (!message) return;
  plannerMessages.push({ role: "user", text: message });
  plannerMessage.value = "";
  renderPlannerHistory();
  plannerSubmit.disabled = true;
  try {
    const response = await fetch(`${AI_API_URL}/api/planner/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: "demo-user", message, history: plannerMessages }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json() as { kind: string; text?: string; summary_text?: string; days?: Array<{ date: string; tasks: Array<{ title: string }> }> };
    if (data.kind === "plan" && data.days?.length) {
      plannerMessages.push({ role: "chief", text: data.summary_text || "플랜을 만들었어요." });
      data.days.flatMap((day) => day.tasks.map((task) => `${day.date} ${task.title}`)).forEach(addTodo);
    } else {
      plannerMessages.push({ role: "chief", text: data.text || "목표를 조금 더 알려주세요." });
    }
    renderPlannerHistory();
  } catch (error) {
    plannerMessages.push({ role: "chief", text: `플래너 호출 실패: ${error instanceof Error ? error.message : String(error)}` });
    renderPlannerHistory();
  } finally {
    plannerSubmit.disabled = false;
  }
});

characterSubmit.addEventListener("click", async () => {
  const checked = Array.from(characterCreateView.querySelectorAll<HTMLInputElement>("input[type='checkbox']:checked"))
    .map((input) => input.value);
  characterSubmit.disabled = true;
  characterResult.textContent = "캐릭터 생성 에이전트가 주민을 만드는 중...";
  try {
    const response = await fetch(`${AI_API_URL}/api/characters/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "demo-user",
        name: characterName.value.trim(),
        persona: characterPersona.value.trim(),
        personality_keywords: checked,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json() as { character_id: string; name: string; persona: string; speech_style: string };
    const resident: Resident = {
      id: data.character_id,
      name: data.name,
      persona: data.persona,
      speech: data.speech_style,
      portrait: ["chef", "gardener", "scribe"][productState.residents.length % 3],
    };
    productState.residents.push(resident);
    productState.imageGenCount += 1;
    saveProductState();
    renderProductPanels();
    characterResult.textContent = `${resident.name} 주민이 이사왔어요.`;
    characterName.value = "";
    characterPersona.value = "";
  } catch (error) {
    characterResult.textContent = `주민 생성 실패: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    characterSubmit.disabled = false;
  }
});

newCharacterBtn.addEventListener("click", () => {
  openFeatureModal("character");
});

questTab.addEventListener("click", () => showTab("quest"));
feedTab.addEventListener("click", () => showTab("feed"));
retroTab.addEventListener("click", () => showTab("retro"));

saveReflectionBtn.addEventListener("click", () => {
  if (!goodPoints.value.trim() && !improvePoints.value.trim()) {
    reflectionStatus.textContent = "회고 내용을 먼저 적어주세요.";
    return;
  }
  if (productState.reflectionDate === todayKey()) {
    reflectionStatus.textContent = "오늘 회고는 이미 저장됐어요.";
    return;
  }
  productState.reflectionDate = todayKey();
  productState.apples += 2;
  saveProductState();
  goodPoints.value = "";
  improvePoints.value = "";
  reflectionStatus.textContent = "회고 저장 완료 · 사과 +2";
  renderProductPanels();
});

addTodoBtn.addEventListener("click", () => {
  if (todoInput.value.trim()) {
    addTodo(todoInput.value);
    todoInput.value = "";
  }
  todoInput.focus();
});

aiTodoBtn.addEventListener("click", () => {
  void organizeTodosWithAi();
});

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void organizeTodosWithAi();
});

todoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.isComposing) {
    event.preventDefault();
    void organizeTodosWithAi();
  }
});

closeDialogue.addEventListener("click", () => {
  document.querySelector(".dialogue")?.classList.toggle("is-collapsed");
});

void sceneReady().then((scene) => {
  scene.events.on("entity-selected", updateEntity);
});

renderTimer();
renderDate();
renderTodos();
renderProductPanels();
updateEntity(selectedEntity);
