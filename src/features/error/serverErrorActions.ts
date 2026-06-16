/**
 * Default actions for the 500 page. Kept out of the `ServerError` component so it
 * stays presentation-only, and split from `app/notFoundActions` because the 500
 * surface recovers differently (retry / home / report) than the 404 (lost path).
 */
import { SUPPORT_EMAIL } from "../../app/notFoundActions.js";

/** "다시 시도하기" fallback — reloads the current page to re-attempt rendering. */
export function reloadPage(): void {
  window.location.reload();
}

/** "메인으로 돌아가기" — navigates to the app home (village). */
export function goHome(): void {
  window.location.assign(import.meta.env.BASE_URL);
}

/**
 * "오류 신고하기" — opens the user's mail client with a pre-filled error report.
 * Used when a retry keeps failing, so the framing is a bug report (not a casual
 * inquiry) to nudge the user to describe what broke.
 */
export function openErrorReportMail(): void {
  const subject = encodeURIComponent("[몽글마을] 🚨 오류 신고");
  const body = encodeURIComponent(
    [
      "안녕하세요, 몽글마을에서 오류가 발생해 신고드려요.",
      "",
      "빠르게 확인할 수 있도록 아래 내용을 적어주세요:",
      "",
      "• 무엇을 하려고 했나요?:",
      "• 어떤 화면/메시지가 보였나요?:",
      "• 오류가 발생한 시각:",
      "",
    ].join("\n"),
  );
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
