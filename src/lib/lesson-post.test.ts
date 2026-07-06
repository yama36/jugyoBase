import { describe, expect, it } from "vitest";
import {
  isLessonCategory,
  lessonPostsFilterHref,
  LESSON_CATEGORY,
  normalizeLessonSubject,
} from "./lesson-post";

describe("isLessonCategory", () => {
  it("treats null as lesson", () => {
    expect(isLessonCategory(null)).toBe(true);
  });

  it("rejects other categories", () => {
    expect(isLessonCategory("業務改善")).toBe(false);
  });
});

describe("normalizeLessonSubject", () => {
  it("trims whitespace", () => {
    expect(normalizeLessonSubject(" 国語 ")).toBe("国語");
  });

  it("maps empty to common label", () => {
    expect(normalizeLessonSubject("")).toBe("共通");
    expect(normalizeLessonSubject("   ")).toBe("共通");
  });
});

describe("lessonPostsFilterHref", () => {
  it("includes lesson category and subject", () => {
    expect(lessonPostsFilterHref("demo", { subject: "国語" })).toBe(
      `/t/demo/posts?category=${encodeURIComponent(LESSON_CATEGORY)}&subject=${encodeURIComponent("国語")}`,
    );
  });
});
