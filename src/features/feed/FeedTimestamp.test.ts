import { describe, expect, it } from "vitest";
import { formatAbsoluteTimestamp, formatFeedTimestamp } from "./FeedTimestamp.js";

const NOW = new Date("2026-06-24T17:00:00+09:00").getTime();

describe("formatFeedTimestamp", () => {
  it("1분 미만은 방금 전으로 표시한다", () => {
    expect(formatFeedTimestamp("2026-06-24T16:59:30+09:00", NOW)).toBe("방금 전");
  });

  it("1시간 미만은 분 단위로 표시한다", () => {
    expect(formatFeedTimestamp("2026-06-24T16:42:00+09:00", NOW)).toBe("18분 전");
  });

  it("24시간 미만은 시간 단위로 표시한다", () => {
    expect(formatFeedTimestamp("2026-06-24T13:00:00+09:00", NOW)).toBe("4시간 전");
  });

  it("24시간 이후는 절대 날짜와 시각으로 표시한다", () => {
    expect(formatFeedTimestamp("2026-06-23T16:59:00+09:00", NOW)).toBe(
      formatAbsoluteTimestamp("2026-06-23T16:59:00+09:00"),
    );
  });
});
