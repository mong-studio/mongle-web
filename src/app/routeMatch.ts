/**
 * Pure path-matching for the router-less village app. The app is served at a
 * single base path; any other pathname is treated as "lost" and should render
 * the 404 page. `base` is passed in (from `import.meta.env.BASE_URL`) instead of
 * read from globals, so this logic stays testable in isolation.
 */
export function normalize(pathname: string): string {
  // Drop a trailing slash so "/app/" and "/app" compare equal (root "/" stays "/").
  return pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
}

/**
 * The OAuth callback path the app must accept so the Kakao `code`/`state` can be
 * consumed on load (the handler then `replaceState`s back to a clean URL).
 * Kept as a fixed root-level path to match `VITE_KAKAO_REDIRECT_URI`.
 */
export const KAKAO_CALLBACK_PATH = "/oauth/kakao/callback";

/** The set of pathnames that count as the app's home, derived from `base`. */
export function knownPaths(base: string): ReadonlySet<string> {
  const normalizedBase = normalize(base || "/");
  const root = normalizedBase === "" ? "/" : normalizedBase;
  return new Set([root, "/", `${root === "/" ? "" : root}/index.html`, KAKAO_CALLBACK_PATH]);
}

/** True when `pathname` is one of the app's known home paths for `base`. */
export function isKnownPath(pathname: string, base: string): boolean {
  return knownPaths(base).has(normalize(pathname));
}
