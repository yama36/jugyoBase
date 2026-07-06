import { describe, expect, it } from "vitest";
import { canAccessTenantRoute } from "./tenant-route-access";

describe("canAccessTenantRoute", () => {
  it("returns true when session tenant slug matches URL", () => {
    expect(
      canAccessTenantRoute(
        { user: { tenantSlug: "demo", tenantId: "t1", id: "u1" } },
        "demo",
      ),
    ).toBe(true);
  });

  it("returns false when session tenant slug mismatches URL", () => {
    expect(
      canAccessTenantRoute(
        { user: { tenantSlug: "school-a", tenantId: "t1", id: "u1" } },
        "school-b",
      ),
    ).toBe(false);
  });

  it("returns false for null session", () => {
    expect(canAccessTenantRoute(null, "demo")).toBe(false);
  });

  it("returns false when tenant slug is missing on session user", () => {
    expect(
      canAccessTenantRoute({ user: { tenantId: "t1", id: "u1" } }, "demo"),
    ).toBe(false);
  });

  it("requires tenantId when option is set", () => {
    expect(
      canAccessTenantRoute(
        { user: { tenantSlug: "demo", id: "u1" } },
        "demo",
        { requireTenantId: true },
      ),
    ).toBe(false);
  });

  it("requires userId when option is set", () => {
    expect(
      canAccessTenantRoute(
        { user: { tenantSlug: "demo", tenantId: "t1" } },
        "demo",
        { requireUserId: true },
      ),
    ).toBe(false);
  });
});
