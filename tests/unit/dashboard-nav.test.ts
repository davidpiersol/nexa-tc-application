import { describe, expect, it } from "vitest";
import { navItemsForPath, profileHrefFromPathname, routeBase } from "@/lib/dashboard-nav";

describe("lib/dashboard-nav profileHrefFromPathname", () => {
  it("returns TC profile for tc routes", () => {
    expect(profileHrefFromPathname("/tc")).toBe("/tc/profile");
    expect(profileHrefFromPathname("/tc/transactions")).toBe("/tc/profile");
  });

  it("scopes buyer profile to transaction id", () => {
    expect(profileHrefFromPathname("/buyer/abc-123")).toBe("/buyer/abc-123/profile");
  });

  it("scopes profile to transaction id for party dashboards except agent hub", () => {
    expect(profileHrefFromPathname("/agent/tx-1")).toBe("/agent/profile");
    expect(profileHrefFromPathname("/seller/tx-2")).toBe("/seller/tx-2/profile");
    expect(profileHrefFromPathname("/mortgage/tx-3")).toBe("/mortgage/tx-3/profile");
    expect(profileHrefFromPathname("/title/tx-4")).toBe("/title/tx-4/profile");
  });

  it("returns agent signing hub when on agent routes", () => {
    expect(profileHrefFromPathname("/agent")).toBe("/agent/profile");
    expect(profileHrefFromPathname("/agent/profile")).toBe("/agent/profile");
  });

  it("uses agent hub route base", () => {
    expect(routeBase("/agent")).toBe("/agent");
    expect(routeBase("/agent/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBe(
      "/agent/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });

  it("uses admin route bases and no profile link", () => {
    expect(routeBase("/admin/global")).toBe("/admin/global/dashboard");
    expect(routeBase("/admin/tenant")).toBe("/admin/tenant/dashboard");
    expect(profileHrefFromPathname("/admin/global")).toBeNull();
  });

  it("includes MLS entry in the TC navigation", () => {
    expect(navItemsForPath("/tc").map((item) => item.href)).toContain("/tc/mls-entry");
  });

  it("includes billing in the TC navigation", () => {
    expect(navItemsForPath("/tc").map((item) => item.href)).toContain("/tc/billing");
  });

  it("includes reports in the TC navigation", () => {
    expect(navItemsForPath("/tc").map((item) => item.href)).toContain("/tc/reports");
  });
});
