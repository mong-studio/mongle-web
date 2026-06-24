import { describe, expect, it } from "vitest";

import {
  colorOf,
  directionOf,
  RESIDENT_HOUSE_COLORS,
  RESIDENT_OFFSETS,
  residenceLabel,
} from "./residence.js";

describe("colorOf", () => {
  it("같은 character_id 는 항상 같은 색을 돌려준다", () => {
    const id = "3f9c1a2b-0000-4444-8888-aaaabbbbcccc";
    expect(colorOf(id)).toBe(colorOf(id));
  });

  it("항상 정의된 4색 중 하나를 돌려준다", () => {
    for (const id of ["a", "b", "c", "d", "e", "f", "long-uuid-1234567890"]) {
      expect(RESIDENT_HOUSE_COLORS).toContain(colorOf(id));
    }
  });
});

describe("directionOf", () => {
  // 화면 좌표(+x=동, -y=북) 기준 각 슬롯의 기대 방위.
  const expected = [
    "북서", // 0: (-220,-126)
    "북동", // 1: (190,-108)
    "남서", // 2: (-314,124) — 서/남서 경계, 남서로 본다
    "남동", // 3: (266,146)
    "남", //  4: (-54,218)
    "북", //  5: (78,-236)
    "서", //  6: (-390,-14)
    "동", //  7: (358,-36)
    "남서", // 8: (-140,300)
    "남동", // 9: (230,280)
  ];

  it.each(RESIDENT_OFFSETS.map((_, i) => i))("슬롯 %i 의 방위", (slot) => {
    // 슬롯 2는 서/남서 경계라 둘 중 하나면 통과
    if (slot === 2) {
      expect(["서", "남서"]).toContain(directionOf(slot));
      return;
    }
    expect(directionOf(slot)).toBe(expected[slot]);
  });

  it("범위를 벗어난 슬롯은 빈 문자열", () => {
    expect(directionOf(99)).toBe("");
  });
});

describe("residenceLabel", () => {
  it('"<방위>쪽 <색>집" 형태', () => {
    const label = residenceLabel(1, "some-character-id");
    expect(label).toMatch(/^(북|북동|동|남동|남|남서|서|북서)쪽 (파란|초록|보라|노랑)집$/);
  });

  it("방위를 알 수 없으면 색만 표시한다", () => {
    expect(residenceLabel(99, "id")).toMatch(/^(파란|초록|보라|노랑)집$/);
  });
});
