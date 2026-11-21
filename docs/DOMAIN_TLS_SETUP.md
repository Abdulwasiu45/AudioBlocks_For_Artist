# Domain, TLS, Redirects, and Canonical Host Setup (OPS-08)

This guide documents the production domain architecture, TLS termination, canonical host enforcement, and redirection strategy for the AudioBlocks Artist Dashboard.

---

## 1. Production Domain Architecture

| Environment           | Canonical Hostname            | Apex / Alternative Host                | Redirect Behavior                       |
| :-------------------- | :---------------------------- | :------------------------------------- | :-------------------------------------- |
| **Production**        | `artists.audioblocks.io`      | `audioblocks.io`, `www.audioblocks.io` | 301 Permanent Redirect to canonical URL |
| **Staging / Preview** | `preview-<pr>.audioblocks.io` | N/A                                    | Preserved per deployment                |
| **Local / Dev**       | `localhost:3000`              | `127.0.0.1:3000`                       | Passthrough (no forced redirect)        |

---

## 2. Canonical Host Enforcement & Middleware Redirects

To prevent duplicate SEO indexing, SSL certificate mismatches, and cookie isolation issues, all non-canonical traffic is permanently redirected (HTTP `301 Moved Permanently`) at the edge/middleware level.

### Configuration

Environment variable in production deployment:

```env
CANONICAL_HOST=artists.audioblocks.io
```

### Middleware Behavior (`app/middleware.ts`)

1. **Host Header Inspection**: Incoming `x-forwarded-host` or `host` headers are extracted and stripped of port numbers.
2. **Canonical Matching**: If `CANONICAL_HOST` is configured and does not match the request host, the request is redirected to `https://${CANONICAL_HOST}${pathname}${search}` with status `301`.
3. **HTTP to HTTPS**: In production, requests where `x-forwarded-proto === "http"` are redirected to `https://` with status `301`.

---

## 3. Strict-Transport-Security (HSTS) Policy

In production, all responses are served with a high-security HSTS policy:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- **Duration**: `max-age=63072000` (2 years) guarantees that modern browsers enforce HTTPS across all visits.
- **Subdomains**: `includeSubDomains` ensures all API and static asset subdomains are protected.
- **Preload**: `preload` marks the domain eligible for inclusion in browser HSTS preload lists (Chromium, Firefox, Safari).

---

## 4. Edge CDN and SSL Termination

### Cloudflare / Reverse Proxy Configuration

1. **SSL/TLS Encryption Mode**: `Full (Strict)` — Enforces valid, unexpired certificates between Cloudflare and the origin server.
2. **Minimum TLS Version**: `TLS 1.2` (TLS 1.3 preferred with 0-RTT enabled).
3. **Cipher Suites**: Modern AEAD cipher suites (e.g. `ECDHE-ECDSA-AES128-GCM-SHA256`, `ECDHE-RSA-AES128-GCM-SHA256`, `ECDHE-ECDSA-CHACHA20-POLY1305`).
4. **Always Use HTTPS**: Enabled at edge.
5. **Automatic HTTPS Rewrites**: Enabled for legacy asset links.

### DNS Records

| Type    | Name      | Target                                                | Proxy Status                        |
| :------ | :-------- | :---------------------------------------------------- | :---------------------------------- |
| `CNAME` | `artists` | `cname.vercel-dns.com.` or `alb.audioblocks.io.`      | Proxied / DNS only per cluster      |
| `CAA`   | `@`       | `0 issue "letsencrypt.org"`, `0 issue "digicert.com"` | Prevents rogue certificate issuance |

---

## 5. Verification Checklist

To verify domain and TLS readiness:

```bash
# 1. Verify 301 canonical host redirect
curl -I -k "http://audioblocks.io/dashboard"
# Expected: HTTP/1.1 301 Moved Permanently -> Location: https://artists.audioblocks.io/dashboard

# 2. Verify HTTPS redirect
curl -I "http://artists.audioblocks.io/dashboard"
# Expected: HTTP/1.1 301 Moved Permanently -> Location: https://artists.audioblocks.io/dashboard

# 3. Verify HSTS header
curl -I "https://artists.audioblocks.io/dashboard"
# Expected: strict-transport-security: max-age=63072000; includeSubDomains; preload
```
