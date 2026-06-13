/**
 * Default actions for the 500 page. Kept out of the `ServerError` component so it
 * stays presentation-only, and split from `app/notFoundActions` because the 500
 * surface recovers differently (retry / home) than the 404 (consult mail).
 */

/** "다시 시도하기" fallback — reloads the current page to re-attempt rendering. */
export function reloadPage(): void {
  window.location.reload();
}

/** "메인으로 돌아가기" — navigates to the app home (village). */
export function goHome(): void {
  window.location.assign(import.meta.env.BASE_URL);
}
