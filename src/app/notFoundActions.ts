/**
 * App-level actions wired into the 404 page. Kept out of the reusable
 * `NotFound` component so the component stays presentation-only and the
 * support address lives in exactly one place.
 */
export const SUPPORT_EMAIL = "team.mongstudio@gmail.com";

/** Opens the user's mail client with a pre-filled 문의 (inquiry) message. */
export function openConsultationMail(): void {
  const subject = encodeURIComponent("[몽글마을] 문의 사항");
  const body = encodeURIComponent(
    [
      "안녕하세요, 몽글마을에 문의드릴 내용이 있어요.",
      "",
      "궁금하신 점이나 불편하신 점을 아래에 자유롭게 적어주세요:",
      "",
      "",
    ].join("\n"),
  );
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
