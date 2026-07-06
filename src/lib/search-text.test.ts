import { describe, expect, it } from "vitest";
import { buildPostSearchText } from "./search-text";

describe("buildPostSearchText", () => {
  it("joins non-empty fields with newlines", () => {
    expect(
      buildPostSearchText({
        title: "タイトル",
        grade: "1年",
        subject: "国語",
        unit: "単元A",
        aim: "めあて",
        tagNames: ["協同学習"],
      }),
    ).toBe("タイトル\n1年\n国語\n単元A\nめあて\n協同学習");
  });

  it("skips empty optional fields", () => {
    expect(
      buildPostSearchText({
        title: null,
        grade: "2年",
        subject: "算数",
        unit: "",
        contentItem: null,
        aim: "aim",
        reflection: null,
        point: undefined,
        flow: "",
        tagNames: [],
      }),
    ).toBe("2年\n算数\naim");
  });
});
