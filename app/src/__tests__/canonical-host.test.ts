import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { getCanonicalRedirect, middleware } from "../../middleware";

describe("Domain, TLS, Redirects and Canonical Host (OPS-08 / #773)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Canonical host enforcement", () => {
    it("redirects non-canonical host to CANONICAL_HOST with 301", () => {
      vi.stubEnv("CANONICAL_HOST", "artists.audioblocks.io");
      const req = new NextRequest("http://audioblocks.io/dashboard/overview", {
        headers: { host: "audioblocks.io" },
      });

      const redirect = getCanonicalRedirect(req);
      expect(redirect).not.toBeNull();
      expect(redirect?.status).toBe(301);
      expect(redirect?.headers.get("location")).toBe(
        "https://artists.audioblocks.io/dashboard/overview"
      );
    });

    it("does not redirect when the host already matches CANONICAL_HOST", () => {
      vi.stubEnv("CANONICAL_HOST", "artists.audioblocks.io");
      const req = new NextRequest("https://artists.audioblocks.io/dashboard/overview", {
        headers: { host: "artists.audioblocks.io" },
      });

      const redirect = getCanonicalRedirect(req);
      expect(redirect).toBeNull();
    });

    it("does not redirect when CANONICAL_HOST is not configured", () => {
      vi.stubEnv("CANONICAL_HOST", "");
      const req = new NextRequest("http://localhost:3000/dashboard", {
        headers: { host: "localhost:3000" },
      });

      const redirect = getCanonicalRedirect(req);
      expect(redirect).toBeNull();
    });
  });

  describe("HTTP to HTTPS redirect in production", () => {
    it("redirects HTTP requests to HTTPS with 301 when x-forwarded-proto is http", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("CANONICAL_HOST", "artists.audioblocks.io");
      const req = new NextRequest("http://artists.audioblocks.io/dashboard", {
        headers: {
          host: "artists.audioblocks.io",
          "x-forwarded-proto": "http",
        },
      });

      const redirect = getCanonicalRedirect(req);
      expect(redirect).not.toBeNull();
      expect(redirect?.status).toBe(301);
      expect(redirect?.headers.get("location")).toBe("https://artists.audioblocks.io/dashboard");
    });
  });

  describe("Strict-Transport-Security (HSTS) headers", () => {
    it("applies HSTS header in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const req = new NextRequest("https://artists.audioblocks.io/login", {
        headers: { host: "artists.audioblocks.io" },
      });

      const response = middleware(req);
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=63072000; includeSubDomains; preload"
      );
    });

    it("does not apply HSTS in development environment", () => {
      vi.stubEnv("NODE_ENV", "development");
      const req = new NextRequest("http://localhost:3000/login", {
        headers: { host: "localhost:3000" },
      });

      const response = middleware(req);
      expect(response.headers.get("Strict-Transport-Security")).toBeNull();
    });
  });
});
