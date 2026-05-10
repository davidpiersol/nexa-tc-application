import { describe, expect, it } from "vitest";
import { profileHrefFromPathname, routeBase } from "@/lib/dashboard-nav";

describe("lib/dashboard-nav profileHrefFromPathname", () => {
  it("returns TC profile for tc routes", () => {
    expect(profileHrefFromPathname("/tc")).toBe("/tc/profile");
    expect(profileHrefFromPathname("/tc/transactions")).toBe("/tc/profile");
  });

  it("scopes buyer profile to transaction id", () => {
    expect(profileHrefFromPathname("/buyer/abc-123")).toBe("/buyer/abc-123/profile");
  });

  it("scopes profile to transaction id for party dashboards", () => {
    expect(profileHrefFromPathname("/agent/tx-1")).toBe("/agent/tx-1/profile");
    expect(profileHrefFromPathname("/seller/tx-2")).toBe("/seller/tx-2/profile");
    expect(profileHrefFromPathname("/mortgage/tx-3")).toBe("/mortgage/tx-3/profile");
    expect(profileHrefFromPathname("/title/tx-4")).toBe("/title/tx-4/profile");
  });

  it("returns null when scoped id is missing", () => {
    expect(profileHrefFromPathname("/agent")).toBeNull();
  });

  it("uses admin route bases and no profile link", () => {
    expect(routeBase("/admin/global")).toBe("/admin/global/dashboard");
    expect(routeBase("/admin/tenant")).toBe("/admin/tenant/dashboard");
    expect(profileHrefFromPathname("/admin/global")).toBeNull();
  });
});
