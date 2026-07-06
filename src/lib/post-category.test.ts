import { describe, expect, it } from "vitest";
import {
  AI_ICT_CATEGORY,
  categoryDisplayLabel,
  getPostSectionLabels,
  isAiIctCategory,
  isBusinessImprovementSubject,
  normalizePostCategory,
  normalizePostSubject,
  subjectRequiredForCategory,
  subjectSelectOptions,
} from "./post-category";

describe("normalizePostCategory", () => {
  it("maps legacy business improvement to AI/ICT", () => {
    expect(normalizePostCategory("業務改善")).toBe(AI_ICT_CATEGORY);
  });
});

describe("normalizePostSubject", () => {
  it("maps legacy business improvement category to subject", () => {
    expect(normalizePostSubject("業務改善", null)).toBe("業務改善");
  });
});

describe("categoryDisplayLabel", () => {
  it("shows the long AI/ICT label", () => {
    expect(categoryDisplayLabel(AI_ICT_CATEGORY)).toBe(
      "AI / ICT活用(授業での活用含む)",
    );
    expect(categoryDisplayLabel("業務改善")).toBe(
      "AI / ICT活用(授業での活用含む)",
    );
  });
});

describe("subjectRequiredForCategory", () => {
  it("requires subject for lesson and AI/ICT", () => {
    expect(subjectRequiredForCategory("授業")).toBe(true);
    expect(subjectRequiredForCategory(AI_ICT_CATEGORY)).toBe(true);
  });
});

describe("subjectSelectOptions", () => {
  it("puts business improvement first for AI/ICT", () => {
    expect(subjectSelectOptions(AI_ICT_CATEGORY)[0]).toBe("業務改善");
  });
});

describe("getPostSectionLabels", () => {
  it("uses business improvement labels when subject is 業務改善", () => {
    const labels = getPostSectionLabels(AI_ICT_CATEGORY, "業務改善");
    expect(labels.aim).toBe("課題・背景");
  });

  it("uses AI/ICT labels for other subjects", () => {
    const labels = getPostSectionLabels(AI_ICT_CATEGORY, "国語");
    expect(labels.aim).toBe("活用場面");
  });
});

describe("isBusinessImprovementSubject", () => {
  it("detects legacy category and AI/ICT + 業務改善 subject", () => {
    expect(isBusinessImprovementSubject("業務改善", null)).toBe(true);
    expect(isBusinessImprovementSubject(AI_ICT_CATEGORY, "業務改善")).toBe(true);
    expect(isBusinessImprovementSubject(AI_ICT_CATEGORY, "国語")).toBe(false);
  });
});

describe("isAiIctCategory", () => {
  it("treats legacy business improvement as AI/ICT", () => {
    expect(isAiIctCategory("業務改善")).toBe(true);
  });
});
