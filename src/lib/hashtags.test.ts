import { describe, expect, it } from "vitest";
import { parseHashtagInput } from "./hashtags";

describe("parseHashtagInput", () => {
  it("splits on spaces", () => {
    expect(parseHashtagInput("a b c")).toEqual(["a", "b", "c"]);
  });

  it("splits on commas", () => {
    expect(parseHashtagInput("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("splits on comma with spaces", () => {
    expect(parseHashtagInput("a, b")).toEqual(["a", "b"]);
  });

  it("splits on fullwidth space", () => {
    expect(parseHashtagInput("a　b")).toEqual(["a", "b"]);
  });

  it("strips hash prefix", () => {
    expect(parseHashtagInput("#a #b")).toEqual(["a", "b"]);
  });

  it("returns empty for empty input", () => {
    expect(parseHashtagInput("")).toEqual([]);
    expect(parseHashtagInput("   ")).toEqual([]);
  });

  it("deduplicates tags", () => {
    expect(parseHashtagInput("a a b")).toEqual(["a", "b"]);
  });

  it("splits on semicolons and pipes", () => {
    expect(parseHashtagInput("a;b|c")).toEqual(["a", "b", "c"]);
  });

  it("splits on slashes", () => {
    expect(parseHashtagInput("a/b／c")).toEqual(["a", "b", "c"]);
  });
});
