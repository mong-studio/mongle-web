/**
 * App-level actions wired into the 404 page. Kept out of the reusable
 * `NotFound` component so the component stays presentation-only and the
 * support address lives in exactly one place.
 */
export const SUPPORT_EMAIL = "team.mongstudio@gmail.com";

/** Opens the user's mail client with a pre-filled 일정 상담 (consultation) request. */
export function openConsultationMail(): void {
  const subject = encodeURIComponent("[몽글마을] 일정 상담 문의");
  const body = encodeURIComponent(
    [
      "안녕하세요, 이장님께 일정 상담을 요청드려요.",
      "",
      "무엇이 궁금하신지 아래에 자유롭게 적어주세요:",
      "",
      "",
    ].join("\n"),
  );
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
