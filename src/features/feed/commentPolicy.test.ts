import { describe, expect, it } from "vitest";
import { canCommentOnAuthor, commentErrorMessage, DAILY_COMMENT_LIMIT } from "./commentPolicy.js";

// axios.isAxiosError 는 isAxiosError 플래그만 확인하므로 최소 객체로 흉내낸다.
function axiosError(status: number): unknown {
  return { isAxiosError: true, response: { status } };
}

describe("commentErrorMessage", () => {
  it("429 → 일일 한도 안내 (한도 수치를 포함)", () => {
    const msg = commentErrorMessage(axiosError(429));
    expect(msg).toContain(String(DAILY_COMMENT_LIMIT));
    expect(msg).toContain("내일");
  });

  it("402 → 사과 부족 안내", () => {
    expect(commentErrorMessage(axiosError(402))).toContain("사과가 부족");
  });

  it("그 외 상태코드는 일반 안내", () => {
    expect(commentErrorMessage(axiosError(500))).toContain("다시 시도");
  });

  it("axios 에러가 아니면 일반 안내", () => {
    expect(commentErrorMessage(new Error("network"))).toContain("다시 시도");
    expect(commentErrorMessage(null)).toContain("다시 시도");
  });
});

describe("canCommentOnAuthor", () => {
  it("활성 주민에게는 댓글을 남길 수 있다", () => {
    expect(canCommentOnAuthor(true)).toBe(true);
  });

  it("이사 간(비활성) 주민에게는 댓글을 남길 수 없다", () => {
    expect(canCommentOnAuthor(false)).toBe(false);
  });
});
