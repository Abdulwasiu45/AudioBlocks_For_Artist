# Staging Environment Provisioning & Parity Checklist (OPS-03)

This document establishes the staging architecture, provisioning workflow, and pre-launch parity checklist for the AudioBlocks Artist Dashboard against the backend testnet and Stellar Soroban Testnet environments.

---

## 1. Executive Summary & Architecture

The staging environment serves as the pre-production gate for AudioBlocks Artist Dashboard deployments. It validates real integrations against the testnet backend service, live Soroban smart contracts, and real Web3 wallet auth (Privy testnet).

### Core Principles
1. **Identical Container Artifact**: Staging runs the exact immutable container image (`audioblocks-artist:<commit_sha>`) built in CI and subsequently promoted to production (OPS-04).
2. **Real Integrations, No Mocks**: `NEXT_PUBLIC_USE_MOCK_DATA=false` is enforced on staging to validate real contract invocations, audio asset streaming, and backend API routes.
3. **Stellar Testnet Alignment**: Horizon and Soroban RPC endpoints target the Stellar Testnet with the public testnet passphrase (`Test SDF Network ; September 2015`).

---

## 2. Environment Parity Matrix

The following checklist compares **Local Development**, **Staging (Testnet)**, and **Production (Mainnet)** to ensure zero architectural drift before launch:

| Dimension | Local Development | Staging (Testnet) (OPS-03) | Production (Mainnet) | Parity Status |
| :--- | :--- | :--- | :--- | :---: |
| **Container Image** | Dynamic dev container (`Dockerfile.dev`) | Standalone immutable image (`Dockerfile`) | Standalone immutable image (`Dockerfile`) | **PARITY (Staging ↔ Prod)** |
| **Node.js Runtime** | Node 20.18.3 (`.nvmrc`) | Node 20.18.3 (`node:20.18.3-alpine`) | Node 20.18.3 (`node:20.18.3-alpine`) | **FULL PARITY** |
| **Base Image Digest** | Pinned digest | Pinned SHA256 digest (OPS-06) | Pinned SHA256 digest (OPS-06) | **FULL PARITY** |
| **User Privileges** | Root in dev container | Non-root `nextjs:nodejs` (UID 1001) | Non-root `nextjs:nodejs` (UID 1001) | **FULL PARITY** |
| **Container Healthcheck** | None | `/api/health` 30s interval probe | `/api/health` 30s interval probe | **FULL PARITY** |
| **Stellar Network** | Testnet / Standalone Soroban | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` | **Config-Isolated** |
| **Stellar RPC Endpoint** | `https://soroban-testnet.stellar.org` | `https://soroban-testnet.stellar.org` | `https://soroban.stellar.org` / Dedicated RPC | **Config-Isolated** |
| **Horizon API** | `https://horizon-testnet.stellar.org` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` | **Config-Isolated** |
| **Backend API URL** | `http://localhost:3001` | `https://api.testnet.audioblocks.io` | `https://api.audioblocks.io` | **Config-Isolated** |
| **Canonical Hostname** | `localhost:3000` | `staging.artists.audioblocks.io` | `artists.audioblocks.io` | **FULL PARITY (OPS-08)** |
| **TLS & HSTS** | HTTP | HTTPS + HSTS (`max-age=63072000`) | HTTPS + HSTS (`max-age=63072000`) | **FULL PARITY** |
| **Mock Data Mode** | Configurable via `.env.local` | `NEXT_PUBLIC_USE_MOCK_DATA=false` | `NEXT_PUBLIC_USE_MOCK_DATA=false` | **PARITY (Staging ↔ Prod)** |
| **Observability (Sentry)** | Disabled / Local | Enabled (`SENTRY_ENVIRONMENT=staging`) | Enabled (`SENTRY_ENVIRONMENT=production`) | **FULL PARITY** |
| **Runtime Config** | `.env.local` | Injected container env (OPS-04) | Injected container env (OPS-04) | **FULL PARITY** |

---

## 3. Staging Configuration Template

Staging is provisioned using `app/.env.staging.example` and `docker-compose.staging.yml`:

```env
# Backend Testnet Environment
NEXT_PUBLIC_API_BASE_URL=https://api.testnet.audioblocks.io
NEXT_PUBLIC_LISTENER_APP_URL=https://testnet.audioblocks.io

# Privy Authentication (Testnet App ID)
NEXT_PUBLIC_PRIVY_APP_ID=your-staging-privy-app-id
PRIVY_APP_SECRET=your-staging-privy-app-secret

# Analytics & Web Vitals
NEXT_PUBLIC_ANALYTICS_WRITE_KEY=staging-analytics-key
NEXT_PUBLIC_WEB_VITALS_ENDPOINT=https://api.testnet.audioblocks.io/web-vitals

# Live Data Mode
NEXT_PUBLIC_USE_MOCK_DATA=false

# Stellar Soroban Testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

# Hostname & Security
NEXT_PUBLIC_BASE_URL=https://staging.artists.audioblocks.io
CANONICAL_HOST=staging.artists.audioblocks.io

# Runtime & Sentry
NODE_ENV=production
SENTRY_ENVIRONMENT=staging
```

---

## 4. Provisioning & Deployment Steps

1. **Build or Pull Promoted Image**:
   ```bash
   docker build --target runner -t audioblocks-artist:staging .
   ```

2. **Deploy via Docker Compose**:
   ```bash
   docker compose -f docker-compose.staging.yml up -d
   ```

3. **Verify Staging Readiness**:
   ```bash
   # Probe container healthcheck
   curl -fsS http://localhost:3000/api/health

   # Verify runtime configuration output
   curl -fsS http://localhost:3000/api/config
   ```

4. **Run Smoke Tests Against Testnet Backend**:
   - Artist authentication via Privy testnet.
   - Profile retrieval from `https://api.testnet.audioblocks.io/artist/profile`.
   - Testnet Soroban contract balance queries.
