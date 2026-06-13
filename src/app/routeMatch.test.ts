import { describe, expect, it } from "vitest";
import { isKnownPath, knownPaths, normalize } from "./routeMatch.js";

describe("normalize", () => {
  it("keeps the root path as-is", () => {
    expect(normalize("/")).toBe("/");
  });

  it("drops a single trailing slash", () => {
    expect(normalize("/app/")).toBe("/app");
  });

  it("leaves a path without a trailing slash unchanged", () => {
    expect(normalize("/app")).toBe("/app");
  });

  it("does not collapse the root to an empty string", () => {
    // "/" has length 1, so the trailing-slash strip must not apply.
    expect(normalize("/")).not.toBe("");
  });
});

describe("knownPaths", () => {
  it("treats root, '/', and index.html as home when base is '/'", () => {
    const paths = knownPaths("/");
    expect(paths.has("/")).toBe(true);
    expect(paths.has("/index.html")).toBe(true);
  });

  it("derives home paths from a non-root base", () => {
    const paths = knownPaths("/app/");
    expect(paths.has("/app")).toBe(true);
    expect(paths.has("/app/index.html")).toBe(true);
    // "/" is always allowed as a fallback home.
    expect(paths.has("/")).toBe(true);
  });

  it("falls back to root when base is empty", () => {
    const paths = knownPaths("");
    expect(paths.has("/")).toBe(true);
  });
});

describe("isKnownPath", () => {
  const base = "/";

  it("accepts the root path", () => {
    expect(isKnownPath("/", base)).toBe(true);
  });

  it("accepts the index.html entry", () => {
    expect(isKnownPath("/index.html", base)).toBe(true);
  });

  it("rejects an unknown path", () => {
    expect(isKnownPath("/does-not-exist", base)).toBe(false);
  });

  it("rejects a nested unknown path", () => {
    expect(isKnownPath("/village/lost/page", base)).toBe(false);
  });

  it("matches the home path regardless of trailing slash", () => {
    expect(isKnownPath("/app/", "/app/")).toBe(true);
    expect(isKnownPath("/app", "/app/")).toBe(true);
  });

  it("rejects a sibling of the base path", () => {
    expect(isKnownPath("/apple", "/app/")).toBe(false);
  });
});
