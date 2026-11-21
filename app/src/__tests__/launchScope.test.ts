import { describe, it, expect } from "vitest";
import { LAUNCH_SCOPE_INVENTORY, isRouteVisibleInLaunch } from "../config/launchScope";

describe("Launch Scope Inventory & Route Audit (PROD-01 / #775)", () => {
  it("inventories all dashboard, admin, and public routes", () => {
    expect(LAUNCH_SCOPE_INVENTORY.length).toBeGreaterThanOrEqual(46);
  });

  it("marks core routes as 'go'", () => {
    const overview = LAUNCH_SCOPE_INVENTORY.find((r) => r.path === "/dashboard/overview");
    const music = LAUNCH_SCOPE_INVENTORY.find((r) => r.path === "/dashboard/my-music");
    const upload = LAUNCH_SCOPE_INVENTORY.find((r) => r.path === "/dashboard/upload-music");

    expect(overview?.status).toBe("go");
    expect(music?.status).toBe("go");
    expect(upload?.status).toBe("go");
  });

  it("marks unfinished and unbuilt routes as 'no-go'", () => {
    const premium = LAUNCH_SCOPE_INVENTORY.find((r) => r.path === "/dashboard/premium");
    const team = LAUNCH_SCOPE_INVENTORY.find((r) => r.path === "/dashboard/team");

    expect(premium?.status).toBe("no-go");
    expect(team?.status).toBe("no-go");
  });

  it("filters out no-go routes from visible launch navigation", () => {
    expect(isRouteVisibleInLaunch("/dashboard/overview")).toBe(true);
    expect(isRouteVisibleInLaunch("/dashboard/my-music")).toBe(true);
    expect(isRouteVisibleInLaunch("/dashboard/premium")).toBe(false);
    expect(isRouteVisibleInLaunch("/dashboard/team")).toBe(false);
  });
});
