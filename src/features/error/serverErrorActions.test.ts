import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { goHome, reloadPage } from "./serverErrorActions.js";

/**
 * Replaces `window.location` with a stub exposing spy `reload`/`assign`, so we
 * can assert navigation intent without jsdom's "Not implemented" navigation.
 */
describe("serverErrorActions", () => {
  let original: PropertyDescriptor | undefined;
  let reload: ReturnType<typeof vi.fn>;
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reload = vi.fn();
    assign = vi.fn();
    original = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload, assign },
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
});
