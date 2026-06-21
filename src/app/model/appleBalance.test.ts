import { describe, expect, it } from "vitest";
import { applyAppleDelta } from "./appleBalance.js";

describe("applyAppleDelta", () => {
  it("20개를 초과한 잔액에도 회고 보상을 상한 없이 더한다", () => {
    // 일일 TODO 보상 한도와 무관하게 회고 보상은 현재 잔액에 그대로 합산한다.
    expect(applyAppleDelta(25, 4)).toBe(29);
  });

  it("회고 수정 비용을 차감하고 잔액은 음수가 되지 않게 한다", () => {
    // 차감액이 잔액보다 크더라도 화면에 음수 잔액이 표시되지 않도록 검증한다.
    expect(applyAppleDelta(25, -15)).toBe(10);
    expect(applyAppleDelta(5, -15)).toBe(0);
  });
});
