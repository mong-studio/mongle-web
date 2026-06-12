# References

## Runtime Dependencies

- Phaser: https://phaser.io/
- React: https://react.dev/
- Vite: https://vite.dev/

---

## Runtime Art

본 프로젝트의 Phaser 마을 화면 및 타일맵 구성에는 `public/assets/map` 폴더에 포함된 에셋을 우선 사용한다.

### Primary Asset Folders

아래 폴더의 에셋을 우선적으로 사용한다.

- `public/assets/map/`

위 폴더들은 몽글마을의 지형, 풀밭, 식물, 나무, 장식 오브젝트, 자연물 배치에 사용할 수 있는 주요 에셋 저장소이다.

### Usage Priority

1. 마을 바닥, 잔디, 길, 자연 지형은 `public/assets/map/`의 Tiled 맵과 타일셋을 우선 사용한다.
2. 추가 장식과 오브젝트는 같은 맵 에셋 세트에 맞춰 추가한다.
3. 기존 Kenney 또는 legacy reference 에셋은 필요한 경우 보조 참고용으로만 사용한다.

---

## Reference Art

### Reference village sprite set

- Reference file: `legacy/reference/village1.png`
- Use: 자연스럽고 불규칙적인 마을 타일 구성 방식 참고
- Do not use: 직접 복사, 트레이싱, 동일한 배치 재현

### Reference screenshot

- Local archive: `legacy/reference/reference-screenshot.png`
- Use: 화면 밀도, HUD 배치, 아늑한 farming-RPG 분위기 참고
- Do not use: 직접 에셋 복사, 정확한 캐릭터/건물/장식 복제

---

## Visual Direction

몽글마을의 마을 화면은 2D 픽셀 기반의 아늑한 farming-RPG 분위기를 지향한다.

전체적인 방향은 다음과 같다.

- 따뜻하고 포근한 마을 분위기
- 자연스럽게 이어지는 풀밭과 길
- 작고 귀여운 장식 오브젝트
- 과도하게 정렬된 느낌보다 손으로 꾸민 듯한 불규칙한 구성
- 캐릭터와 건물이 자연스럽게 놓일 수 있는 여백
- 사용자가 오래 머물고 싶은 감성적인 마을 공간

---

## Tile and Asset Placement Rules

타일과 장식 에셋을 배치할 때는 `village1.png`의 구성을 참고하여, 기계적으로 반복되는 패턴을 피하고 자연스럽게 연결되는 배치를 만든다.

### 1. Avoid Mechanical Repetition

다음과 같은 배치는 피한다.

- 같은 꽃 에셋을 일정 간격으로 반복 배치
- 같은 풀 장식을 격자처럼 규칙적으로 반복
- 같은 나무나 바위를 일렬로 배치
- 동일한 타일을 넓은 영역에 그대로 반복
- 오브젝트 간 간격이 지나치게 균일한 배치

나쁜 예시:

```text
꽃  꽃  꽃  꽃
꽃  꽃  꽃  꽃
꽃  꽃  꽃  꽃
```

좋은 예시:

```text
꽃     풀꽃
   작은 풀       버섯
나무          꽃무리
      풀잎
```

### 2. Use Irregular Clusters

식물, 꽃, 버섯, 작은 풀, 돌, 나무 장식은 단일 오브젝트를 반복하기보다 여러 에셋을 섞어 작은 군집처럼 배치한다.

권장 방식:

- 꽃 1개만 반복하지 말고 꽃, 풀, 작은 덤불, 버섯을 섞는다.
- 같은 종류의 에셋도 방향, 위치, 간격을 다르게 배치한다.
- 장식은 2~5개 단위의 작은 cluster로 배치한다.
- cluster 사이에는 빈 공간을 두어 답답하지 않게 만든다.
- 건물이나 길 주변에는 장식 밀도를 조금 높이고, 외곽으로 갈수록 자연스럽게 줄인다.

### 3. Make Tiles Feel Connected

타일맵은 단절된 오브젝트 나열이 아니라 하나의 마을 공간처럼 보여야 한다.

권장 방식:

- 잔디, 흙길, 꽃, 나무가 서로 자연스럽게 이어지도록 배치한다.
- 길 가장자리에는 작은 풀이나 꽃을 불규칙하게 배치한다.
- 나무 아래에는 풀, 버섯, 돌 같은 작은 장식을 함께 배치한다.
- 건물 주변에는 화분, 풀, 꽃, 울타리 등을 섞어 생활감이 느껴지게 만든다.
- 장식 오브젝트가 떠 있는 것처럼 보이지 않도록 바닥 타일과 어울리게 배치한다.

### 4. Vary Density

마을 전체의 밀도가 균일하면 인공적으로 보일 수 있다.

권장 밀도:

- 중심부: 건물, 길, 장식 밀도 높음
- 캐릭터 이동 공간: 장식 밀도 낮음
- 외곽부: 나무, 풀, 자연물 중심
- 모서리/빈 공간: 작은 장식으로 자연스럽게 보완

### 5. Keep Walkable Areas Clear

장식이 많더라도 캐릭터 이동과 상호작용 공간은 확보해야 한다.

규칙:

- 주요 길 위에는 큰 오브젝트를 배치하지 않는다.
- 건물 입구 앞에는 최소한의 빈 공간을 둔다.
- 캐릭터 스폰 위치 주변은 과도하게 장식하지 않는다.
- 클릭 가능한 오브젝트와 단순 장식 오브젝트가 시각적으로 구분되도록 한다.

---

## Asset Usage Guidelines

### Terrain

Use:
- `grass_tileset/`
- `lpc-terrains/`

For:
- 잔디 바닥
- 흙길
- 지형 경계
- 자연스러운 풀밭 전환
- 마을 외곽 지형

Guidelines:
- 단일 잔디 타일만 넓게 반복하지 않는다.
- 밝기나 패턴이 다른 잔디 타일을 섞어 자연스러운 변화를 만든다.
- 길은 완전히 직선으로만 구성하지 말고 약간 꺾이거나 넓이가 달라지게 구성한다.

### Plants and Nature Objects

Use:
- `lpc-flowers-plants-fungi-wood/`

For:
- 꽃
- 풀
- 작은 덤불
- 버섯
- 나무
- 목재 소품
- 자연 장식

Guidelines:
- 꽃과 식물은 군집 단위로 배치한다.
- 같은 꽃을 반복하지 말고 색상과 형태가 다른 식물을 섞는다.
- 나무 주변에는 작은 풀, 버섯, 돌을 함께 배치해 자연스럽게 보이게 한다.

### Decorative Objects

Use:
- `submission_daneeklu/`
- 필요 시 `public/assets/map`에 추가한 새 타일셋

For:
- 마을 소품
- 건물 주변 장식
- 작은 오브젝트
- 분위기 보강 요소

Guidelines:
- 장식은 화면을 채우기 위한 용도가 아니라 마을 생활감을 만들기 위한 용도로 배치한다.
- 동일한 장식이 반복적으로 보이지 않도록 위치와 조합을 다르게 한다.

---

## Implementation Notes for Codex

When implementing or modifying the tilemap, follow these rules.

1. Load runtime assets primarily from `public/assets/map`.
2. Keep `mongle.tmj`, tileset `.tsx` files, and tile images in sync.
3. Use `legacy/reference/village1.png` only as a visual reference for natural composition.
4. Do not copy the reference image directly.
5. Avoid placing the same decorative asset repeatedly in a grid-like pattern.
6. Build natural-looking clusters using multiple plant and decoration sprites.
7. Keep paths, entrances, and character movement areas clear.
8. Use irregular spacing, varied density, and mixed asset types.
9. Make the village feel connected, cozy, and hand-crafted.
10. If a procedural placement function is used, include randomness with constraints:
    - varied asset selection
    - varied spacing
    - cluster-based placement
    - collision checks
    - walkable-area protection

---

## Procedural Placement Suggestions

If creating a helper function for natural decoration placement, use the following approach.

### Suggested algorithm

1. Define decoration zones.
2. Exclude walkable paths and building entrances.
3. Select a random cluster center.
4. Choose 2~5 assets from different plant/deco categories.
5. Place them with small random offsets.
6. Check collision and spacing.
7. Repeat with varied density per zone.

### Pseudocode

```ts
const clusterSize = randomInt(2, 5);
const clusterCenter = pickValidDecorationPosition();

for (let i = 0; i < clusterSize; i++) {
  const asset = pickRandom([
    flowers,
    smallGrass,
    mushrooms,
    shrubs,
    stones,
  ]);

  const offsetX = randomInt(-2, 2) * tileSize;
  const offsetY = randomInt(-2, 2) * tileSize;

  const x = clusterCenter.x + offsetX;
  const y = clusterCenter.y + offsetY;

  if (isValidDecorationTile(x, y)) {
    placeDecoration(asset, x, y);
  }
}
```

Important:
- Do not use pure random noise across the entire map.
- Use cluster-based randomness to make the map feel intentionally decorated.
- Avoid perfect symmetry unless it is a designed plaza or special area.

---

## Original Planning Notes

The initial implementation plan is archived at:

- `legacy/plans/original-plan.md`
