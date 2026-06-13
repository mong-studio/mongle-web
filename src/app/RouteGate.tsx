import type { ReactNode } from "react";
import { NotFound } from "../features/error/NotFound.js";
import { openConsultationMail } from "./notFoundActions.js";
import { isKnownPath } from "./routeMatch.js";

/**
 * Router-less unknown-path guard. The village app is a single screen served at
 * the app base path. Any other pathname is treated as "lost" and rendered as
 * the cozy 404 page. Hash and query strings do not affect the match — only the
 * pathname segment does. Path-matching lives in `routeMatch.ts` so it can be
 * unit-tested without touching `window`.
 *
 * Assumption: the pathname is read once per render, so the guard only re-evaluates
 * on a full page load / hard navigation. This is correct while the app has no
 * client-side router; if `history.pushState`-based routing is ever introduced,
 * this must listen for `popstate` (and the route change) to re-run the check.
 */
export function RouteGate({ children }: { children: ReactNode }) {
  const base = import.meta.env.BASE_URL || "/";
  if (!isKnownPath(window.location.pathname, base)) {
    return <NotFound onConsult={openConsultationMail} />;
  }
  return <>{children}</>;
}
