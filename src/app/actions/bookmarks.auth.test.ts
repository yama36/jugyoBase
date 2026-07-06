import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bookmark: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    post: {
      findFirst: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toggleBookmark } from "@/app/actions/bookmarks";

describe("toggleBookmark authorization", () => {
  it("rejects when session is missing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await toggleBookmark("demo", "post-1");

    expect(result).toEqual({ ok: false, error: "認証が必要です" });
    expect(prisma.post.findFirst).not.toHaveBeenCalled();
  });

  it("uses session tenantId instead of trusting client-supplied slug alone", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", tenantId: "tenant-a", tenantSlug: "school-a" },
    } as never);
    vi.mocked(prisma.post.findFirst).mockResolvedValue(null);

    await toggleBookmark("school-b", "post-1");

    expect(prisma.post.findFirst).toHaveBeenCalledWith({
      where: { id: "post-1", tenantId: "tenant-a" },
    });
  });
});
