import { describe, expect, it } from "vitest";
import { pickPostThumbAttachment, postThumbKindLabel } from "./post-thumb";

const clean = (kind: "image" | "pdf" | "video", id: string) => ({
  id,
  kind,
  originalFilename: `${id}.bin`,
  malwareScanStatus: "clean" as const,
});

describe("pickPostThumbAttachment", () => {
  it("prefers image over video and pdf", () => {
    const picked = pickPostThumbAttachment([
      clean("pdf", "p1"),
      clean("video", "v1"),
      clean("image", "i1"),
    ]);
    expect(picked?.id).toBe("i1");
  });

  it("falls back to video when no image", () => {
    const picked = pickPostThumbAttachment([
      clean("pdf", "p1"),
      clean("video", "v1"),
    ]);
    expect(picked?.id).toBe("v1");
  });

  it("skips non-clean attachments", () => {
    const picked = pickPostThumbAttachment([
      {
        ...clean("video", "v1"),
        malwareScanStatus: "pending",
      },
      clean("pdf", "p1"),
    ]);
    expect(picked?.id).toBe("p1");
  });
});

describe("postThumbKindLabel", () => {
  it("labels video", () => {
    expect(postThumbKindLabel("video")).toBe("動画");
  });
});
