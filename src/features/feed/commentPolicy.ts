import { isAxiosError } from "axios";

// 서버(apps/posts/views.py)의 댓글 작성 정책과 일치시켜 둔다.
export const COMMENT_TOKEN_COST = 3;
export const DAILY_COMMENT_LIMIT = 5;

// 서버가 돌려주는 상태코드를 몽글마을 말투의 안내 문구로 변환한다.
export function commentErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 429) {
      return `오늘은 댓글을 ${DAILY_COMMENT_LIMIT}개까지 남길 수 있어요. 내일 또 만나요 🌷`;
    }
    if (error.response?.status === 402) {
      return "사과가 부족해 댓글을 남길 수 없어요.";
    }
  }
  return "댓글을 남기지 못했어요. 잠시 후 다시 시도해주세요.";
}
