import { describe, expect, it } from "vitest";
import { buildCsvRow, escapeCsvCell } from "./csv";

describe("escapeCsvCell", () => {
  it("quotes cells containing commas", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
  });

  it("escapes double quotes", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("returns empty string for null", () => {
    expect(escapeCsvCell(null)).toBe("");
  });
});

describe("buildCsvRow", () => {
  it("joins escaped cells with commas", () => {
    expect(buildCsvRow(["a", "b,c", 1])).toBe('a,"b,c",1');
  });
});
