import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Rollback Procedure & Verification Drill (OPS-05)", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const rollbackDocPath = path.join(rootDir, "docs/ROLLBACK_PROCEDURE.md");
  const rollbackScriptPath = path.join(rootDir, "scripts/rollback-drill.sh");

  it("maintains comprehensive rollback procedure documentation", () => {
    expect(fs.existsSync(rollbackDocPath)).toBe(true);
    const content = fs.readFileSync(rollbackDocPath, "utf-8");

    expect(content).toContain("Rollback Trigger Criteria");
    expect(content).toContain("Immutable Container Image Rollback");
    expect(content).toContain("Recorded Rollback Drill");
    expect(content).toContain("MTTR");
  });

  it("provides an executable rollback drill harness script", () => {
    expect(fs.existsSync(rollbackScriptPath)).toBe(true);
    const script = fs.readFileSync(rollbackScriptPath, "utf-8");

    expect(script).toContain("/api/health");
    expect(script).toContain("ROLLBACK DRILL");
  });
});
