import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Docker Image Hardening & Configuration (OPS-06 & OPS-04)", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const dockerfilePath = path.join(rootDir, "Dockerfile");
  const dockerComposePath = path.join(rootDir, "docker-compose.yml");
  const ciWorkflowPath = path.join(rootDir, ".github/workflows/ci.yml");

  it("pins base image with SHA256 digest in all stages", () => {
    const dockerfile = fs.readFileSync(dockerfilePath, "utf-8");
    const fromLines = dockerfile.split("\n").filter((l) => l.trim().startsWith("FROM"));

    expect(fromLines.length).toBeGreaterThanOrEqual(3);
    for (const line of fromLines) {
      expect(line).toContain("@sha256:");
    }
  });

  it("enforces non-root nextjs user execution in runner stage", () => {
    const dockerfile = fs.readFileSync(dockerfilePath, "utf-8");
    expect(dockerfile).toContain("USER nextjs");
    expect(dockerfile).toContain("addgroup --system --gid 1001 nodejs");
    expect(dockerfile).toContain("adduser --system --uid 1001 nextjs");
    expect(dockerfile).toContain("--chown=nextjs:nodejs /app/public");
  });

  it("configures container healthcheck probe pointing to /api/health", () => {
    const dockerfile = fs.readFileSync(dockerfilePath, "utf-8");
    expect(dockerfile).toContain("HEALTHCHECK");
    expect(dockerfile).toContain("/api/health");
  });

  it("does not bake hardcoded environment secrets into docker-compose.yml args", () => {
    const compose = fs.readFileSync(dockerComposePath, "utf-8");
    // Build args in app service should not inline NEXT_PUBLIC_*
    const appService = compose.split("app:")[1] || "";
    expect(appService).not.toContain("args:");
    expect(appService).toContain("environment:");
  });

  it("includes Trivy container vulnerability scanner in CI workflow", () => {
    const ciWorkflow = fs.readFileSync(ciWorkflowPath, "utf-8");
    expect(ciWorkflow).toContain("aquasecurity/trivy-action");
    expect(ciWorkflow).toContain("Run Trivy vulnerability scanner");
  });
});
