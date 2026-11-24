import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

describe("Static Assets Caching & CDN Headers (OPS-07 / #772)", () => {
  it("defines headers function in next.config.ts", () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe("function");
  });

  it("configures immutable caching for /_next/static hashed assets", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("nextConfig.headers is not a function");
    }
    const headersList = await nextConfig.headers();
    const staticRule = headersList.find((rule) => rule.source === "/_next/static/:path*");

    expect(staticRule).toBeDefined();
    const cacheHeader = staticRule?.headers.find((h) => h.key.toLowerCase() === "cache-control");
    expect(cacheHeader).toBeDefined();
    expect(cacheHeader?.value).toContain("immutable");
    expect(cacheHeader?.value).toContain("max-age=31536000");
  });

  it("configures caching with stale-while-revalidate for images and public assets", async () => {
    if (typeof nextConfig.headers !== "function") {
      throw new Error("nextConfig.headers is not a function");
    }
    const headersList = await nextConfig.headers();

    const imageRule = headersList.find((rule) => rule.source === "/_next/image/:path*");
    expect(imageRule).toBeDefined();
    const imageCache = imageRule?.headers.find((h) => h.key.toLowerCase() === "cache-control");
    expect(imageCache?.value).toContain("max-age=86400");
    expect(imageCache?.value).toContain("stale-while-revalidate=604800");

    const assetRule = headersList.find(
      (rule) => rule.source === "/(images|icons|fonts|audio)/:path*"
    );
    expect(assetRule).toBeDefined();
    const assetCache = assetRule?.headers.find((h) => h.key.toLowerCase() === "cache-control");
    expect(assetCache?.value).toContain("max-age=86400");
    expect(assetCache?.value).toContain("stale-while-revalidate=604800");
  });
});
