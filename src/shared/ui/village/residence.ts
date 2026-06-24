// 마을 거주지(집 위치·색) 부여 로직.
// 마을 렌더(features/village)와 마이페이지(features/my-page)가 함께 쓰므로 shared 에 둔다.
//
// - 위치(방위): 슬롯(캐릭터 목록에서의 인덱스) → 이장님집 중심 기준 상대 좌표 → 8방위
// - 색: character_id(불변 UUID) 해시 → 4색 중 하나로 고정 (목록 순서와 무관, 영구 고정)

/** 이장님집 중심 기준 주민 집의 상대 좌표(px). 인덱스 = 슬롯(캐릭터 목록 순서). */
export const RESIDENT_OFFSETS: ReadonlyArray<readonly [number, number]> = [
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

export const RESIDENT_HOUSE_COLORS = ["blue", "green", "purple", "yellow"] as const;
export type ResidentHouseColor = (typeof RESIDENT_HOUSE_COLORS)[number];

const HOUSE_COLOR_LABEL: Record<ResidentHouseColor, string> = {
  blue: "파란집",
  green: "초록집",
  purple: "보라집",
  yellow: "노랑집",
};

// 화면 좌표 기준(+x=동, -y=북) 8방위. atan2(북, 동) 각도를 45도 단위로 버킷팅.
const DIRECTION_LABELS = ["동", "북동", "북", "북서", "서", "남서", "남", "남동"] as const;

/** character_id 를 4색 중 하나로 결정론적 매핑 → 캐릭터별 집 색을 영구 고정한다. */
export function colorOf(characterId: string): ResidentHouseColor {
  let hash = 0;
  for (let i = 0; i < characterId.length; i++) {
    hash = (hash * 31 + characterId.charCodeAt(i)) >>> 0;
  }
  return RESIDENT_HOUSE_COLORS[hash % RESIDENT_HOUSE_COLORS.length];
}

/** 슬롯의 offset 을 이장님집 기준 8방위 문자열로. 범위를 벗어나면 빈 문자열. */
export function directionOf(slot: number): string {
  const offset = RESIDENT_OFFSETS[slot];
  if (!offset) return "";
  const [x, y] = offset;
  const angle = Math.atan2(-y, x); // -PI..PI, 0=동, 반시계(+)가 북쪽
  const sector = Math.round(angle / (Math.PI / 4)); // 45도 단위, -4..4
  const idx = ((sector % 8) + 8) % 8;
  return DIRECTION_LABELS[idx];
}

/** "북동쪽 파란집" 형태의 거주지 라벨. 방위를 알 수 없으면 색만 반환한다. */
export function residenceLabel(slot: number, characterId: string): string {
  const colorLabel = HOUSE_COLOR_LABEL[colorOf(characterId)];
  const dir = directionOf(slot);
  return dir ? `${dir}쪽 ${colorLabel}` : colorLabel;
}
