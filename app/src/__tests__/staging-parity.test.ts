import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Staging Environment Parity (OPS-03)", () => {
  const rootDir = path.resolve(__dirname, "../../..");
  const stagingDocPath = path.join(rootDir, "docs/STAGING_ENVIRONMENT_PARITY.md");
  const stagingEnvPath = path.join(rootDir, "app/.env.staging.example");
  const stagingComposePath = path.join(rootDir, "docker-compose.staging.yml");

  it("provides complete staging parity checklist documentation", () => {
    expect(fs.existsSync(stagingDocPath)).toBe(true);
    const content = fs.readFileSync(stagingDocPath, "utf-8");

    expect(content).toContain("Environment Parity Matrix");
    expect(content).toContain("Test SDF Network ; September 2015");
    expect(content).toContain("soroban-testnet.stellar.org");
    expect(content).toContain("NEXT_PUBLIC_USE_MOCK_DATA=false");
  });

  it("configures staging env template against backend testnet and Soroban testnet", () => {
    expect(fs.existsSync(stagingEnvPath)).toBe(true);
    const env = fs.readFileSync(stagingEnvPath, "utf-8");

    expect(env).toContain("NEXT_PUBLIC_API_BASE_URL=https://api.testnet.audioblocks.io");
    expect(env).toContain("NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015");
    expect(env).toContain("NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org");
    expect(env).toContain("NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org");
    expect(env).toContain("NEXT_PUBLIC_USE_MOCK_DATA=false");
  });

  it("defines docker-compose.staging.yml with healthcheck and testnet endpoints", () => {
    expect(fs.existsSync(stagingComposePath)).toBe(true);
    const compose = fs.readFileSync(stagingComposePath, "utf-8");

    expect(compose).toContain("audioblocks-artist-staging");
    expect(compose).toContain("NEXT_PUBLIC_API_BASE_URL");
    expect(compose).toContain("healthcheck:");
  });
});
