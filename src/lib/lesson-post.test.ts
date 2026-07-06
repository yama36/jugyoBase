import { describe, expect, it } from "vitest";
import {
  isLessonCategory,
  lessonPostsFilterHref,
  LESSON_CATEGORY,
} from "./lesson-post";

describe("isLessonCategory", () => {
  it("treats null as lesson", () => {
    expect(isLessonCategory(null)).toBe(true);
  });

  it("rejects other categories", () => {
    expect(isLessonCategory("業務改善")).toBe(false);
  });
});

describe("lessonPostsFilterHref", () => {
  it("includes lesson category and subject", () => {
    expect(lessonPostsFilterHref("demo", { subject: "国語" })).toBe(
      `/t/demo/posts?category=${encodeURIComponent(LESSON_CATEGORY)}&subject=${encodeURIComponent("国語")}`,
    );
  });
});
