import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseHashtagInput } from "./hashtags";

describe("parseHashtagInput", () => {
  it("splits on spaces", () => {
    assert.deepEqual(parseHashtagInput("a b c"), ["a", "b", "c"]);
  });

  it("splits on commas", () => {
    assert.deepEqual(parseHashtagInput("a,b,c"), ["a", "b", "c"]);
  });

  it("splits on comma with spaces", () => {
    assert.deepEqual(parseHashtagInput("a, b"), ["a", "b"]);
  });

  it("splits on fullwidth space", () => {
    assert.deepEqual(parseHashtagInput("a　b"), ["a", "b"]);
  });

  it("strips hash prefix", () => {
    assert.deepEqual(parseHashtagInput("#a #b"), ["a", "b"]);
  });

  it("returns empty for empty input", () => {
    assert.deepEqual(parseHashtagInput(""), []);
    assert.deepEqual(parseHashtagInput("   "), []);
  });

  it("deduplicates tags", () => {
    assert.deepEqual(parseHashtagInput("a a b"), ["a", "b"]);
  });

  it("splits on semicolons and pipes", () => {
    assert.deepEqual(parseHashtagInput("a;b|c"), ["a", "b", "c"]);
  });

  it("splits on slashes", () => {
    assert.deepEqual(parseHashtagInput("a/b／c"), ["a", "b", "c"]);
  });
});
