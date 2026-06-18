import { describe, expect, it } from "vitest";
import { readableInk } from "./Tag.js";

describe("readableInk", () => {
  it("darkens light pastel colors so text stays readable", () => {
    const ink = readableInk("#E7D39F");
    expect(ink).not.toBe("#E7D39F");
    expect(ink).toBe("#7f7457");
  });

  it("leaves already-dark colors untouched", () => {
    expect(readableInk("#1a1a1a")).toBe("#1a1a1a");
  });

  it("returns the input unchanged when not a 6-digit hex", () => {
    expect(readableInk("var(--accent)")).toBe("var(--accent)");
  });
});
