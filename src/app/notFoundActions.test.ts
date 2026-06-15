import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openConsultationMail, SUPPORT_EMAIL } from "./notFoundActions.js";

/**
 * Replaces `window.location` with a stub whose `href` setter just records the
 * assigned value, so we can assert the mailto: URL without jsdom attempting a
 * real navigation.
 */
describe("openConsultationMail", () => {
  let assigned: string;
  let original: PropertyDescriptor | undefined;

  beforeEach(() => {
    assigned = "";
    original = Object.getOwnPropertyDescriptor(window, "location");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        get href() {
          return assigned;
        },
        set href(value: string) {
          assigned = value;
        },
      },
    });
  });

  afterEach(() => {
    if (original) {
      Object.defineProperty(window, "location", original);
    }
  });

  it("navigates to a mailto: link for the support address", () => {
    openConsultationMail();
    expect(assigned.startsWith(`mailto:${SUPPORT_EMAIL}?`)).toBe(true);
  });

  it("includes a decoded subject and body", () => {
    openConsultationMail();
    const params = new URLSearchParams(new URL(assigned).search);
    expect(params.get("subject")).toBe("[몽글마을] 문의 사항");
    expect(params.get("body")).toContain("문의드릴 내용이 있어요");
  });

  it("targets exactly the team support inbox", () => {
    expect(SUPPORT_EMAIL).toBe("team.mongstudio@gmail.com");
  });
});
