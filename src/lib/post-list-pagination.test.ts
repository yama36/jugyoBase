import { describe, expect, it } from "vitest";
import {
  buildPostListHref,
  buildPostListQueryString,
  clampPostListPage,
  parsePostListPage,
  parsePostListPerPage,
  totalPostListPages,
} from "./post-list-pagination";

describe("parsePostListPerPage", () => {
  it("defaults to 30", () => {
    expect(parsePostListPerPage(undefined)).toBe(30);
    expect(parsePostListPerPage("999")).toBe(30);
  });

  it("accepts allowed values", () => {
    expect(parsePostListPerPage("50")).toBe(50);
    expect(parsePostListPerPage("100")).toBe(100);
  });
});

describe("parsePostListPage", () => {
  it("defaults invalid values to 1", () => {
    expect(parsePostListPage(undefined)).toBe(1);
    expect(parsePostListPage("0")).toBe(1);
    expect(parsePostListPage("-1")).toBe(1);
  });

  it("floors positive numbers", () => {
    expect(parsePostListPage("2.9")).toBe(2);
  });
});

describe("totalPostListPages", () => {
  it("returns 1 for empty results", () => {
    expect(totalPostListPages(0, 30)).toBe(1);
  });

  it("ceil-divides by per page", () => {
    expect(totalPostListPages(30, 30)).toBe(1);
    expect(totalPostListPages(31, 30)).toBe(2);
    expect(totalPostListPages(90, 50)).toBe(2);
  });
});

describe("clampPostListPage", () => {
  it("clamps to valid range", () => {
    expect(clampPostListPage(99, 3)).toBe(3);
    expect(clampPostListPage(0, 3)).toBe(1);
  });
});

describe("buildPostListQueryString", () => {
  it("omits default page and per", () => {
    expect(buildPostListQueryString({})).toBe("");
    expect(buildPostListQueryString({ subject: "数学" })).toBe("?subject=%E6%95%B0%E5%AD%A6");
  });

  it("includes page and per when non-default", () => {
    expect(buildPostListQueryString({ page: 2, per: 50 })).toBe("?page=2&per=50");
  });
});

describe("buildPostListHref", () => {
  it("builds tenant posts path", () => {
    expect(buildPostListHref("demo", { page: 2, per: 50 })).toBe(
      "/t/demo/posts?page=2&per=50",
    );
  });
});
