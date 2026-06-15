import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUPPORT_EMAIL } from "../../app/notFoundActions.js";
import { goHome, openErrorReportMail, reloadPage } from "./serverErrorActions.js";

/**
 * Replaces `window.location` with a stub exposing spy `reload`/`assign` plus an
 * `href` setter that records assignments, so we can assert navigation/mailto
 * intent without jsdom's "Not implemented" navigation.
 */
describe("serverErrorActions", () => {
  let original: PropertyDescriptor | undefined;
  let reload: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;
  let assignedHref: string;

  beforeEach(() => {
    reload = vi.fn();
    assign = vi.fn();
    assignedHref = "";
    original = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        reload,
        assign,
        get href() {
          return assignedHref;
        },
        set href(value: string) {
          assignedHref = value;
        },
      },
    });
  });

  afterEach(() => {
    if (original) {
      Object.defineProperty(window, "location", original);
    }
  });

  it("reloadPage reloads the current page exactly once", () => {
    reloadPage();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("goHome navigates to the app base path", () => {
    goHome();
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign.mock.calls[0][0]).toBe(import.meta.env.BASE_URL);
  });

  it("openErrorReportMail opens a mailto with an error-report subject and body", () => {
    openErrorReportMail();
    expect(assignedHref.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
    const params = new URLSearchParams(new URL(assignedHref).search);
    expect(params.get("subject")).toBe("[몽글마을] 🚨 오류 신고");
    expect(params.get("body")).toContain("오류가 발생해 신고드려요");
  });
});
