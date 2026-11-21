import { type NextRequest, NextResponse } from "next/server";

export interface CspOptions {
  /** Development relaxes scripts for HMR and dev tools; production is strict. */
  isDev: boolean;
  /** Per-request nonce allowing Next.js's inline bootstrap scripts in production. */
  nonce?: string;
}

/** Dev servers on localhost; `ws:`/`wss:` are already allowed by the base policy. */
const DEV_CONNECT_SOURCES = "http://localhost:*";

/**
 * Builds the Content-Security-Policy for an environment.
 *
 * Development allows `unsafe-eval` and inline scripts so HMR and React dev
 * tooling keep working, plus localhost connections. Production allows no eval
 * and no inline scripts: only same-origin scripts, third-party hosts, and
 * scripts carrying the request nonce. Adding a nonce makes browsers ignore
 * `unsafe-inline`, so the nonce is only included for production.
 */
export function buildCsp({ isDev, nonce }: CspOptions): string {
  const thirdPartyScripts = "https://js.stripe.com https://*.sentry.io";
  const scriptSources = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' ${thirdPartyScripts}`
    : `'self' 'nonce-${nonce ?? ""}' 'strict-dynamic' ${thirdPartyScripts}`;

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https:",
    `connect-src 'self' https: ws: wss:${isDev ? ` ${DEV_CONNECT_SOURCES}` : ""}`,
    "media-src 'self' https: blob:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** A base64 nonce from 16 random bytes, generated fresh for each request. */
export function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

export interface MiddlewareCookieReader {
  get(name: string): { value: string } | undefined;
}

export interface MiddlewareRequestLike {
  nextUrl: {
    pathname: string;
    search: string;
  };
  cookies: MiddlewareCookieReader;
}

export type MiddlewareDecision = { type: "next" } | { type: "redirect"; redirectPath: string };

function decodeBase64Url(segment: string): string {
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    if (typeof atob === "function") {
      return atob(padded);
    }
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const jsonStr = decodeBase64Url(parts[1]);
    if (!jsonStr) return true;
    const payload = JSON.parse(jsonStr) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function sanitizeReturnTo(path: string): string {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return "/dashboard";
  }
  return path;
}

export function getMiddlewareDecision(req: MiddlewareRequestLike): MiddlewareDecision {
  const { pathname, search } = req.nextUrl;

  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (!isProtected) {
    return { type: "next" };
  }

  const privyToken =
    req.cookies.get("privy-token")?.value || req.cookies.get("privy-session")?.value;
  const appJwt = req.cookies.get("audioblocks_jwt")?.value || req.cookies.get("token")?.value;

  const activeToken = privyToken || appJwt;

  if (!activeToken || isTokenExpired(activeToken)) {
    const rawTarget = `${pathname}${search}`;
    const returnTo = sanitizeReturnTo(rawTarget);
    return {
      type: "redirect",
      redirectPath: `/login?returnTo=${encodeURIComponent(returnTo)}`,
    };
  }

  return { type: "next" };
}

export function getCanonicalRedirect(request: NextRequest): NextResponse | null {
  const canonicalHost = process.env.CANONICAL_HOST;
  const rawHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || request.nextUrl.host;
  const currentHost = rawHost.split(":")[0];
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (request.url.startsWith("https") ? "https" : "http");
  const isProd = process.env.NODE_ENV === "production";

  // Enforce canonical host redirection (301 permanent) if CANONICAL_HOST is set and differs
  if (canonicalHost && currentHost && currentHost !== canonicalHost) {
    const redirectUrl = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `https://${canonicalHost}`
    );
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Enforce HTTPS redirection in production when behind an HTTP proxy/load-balancer
  if (
    isProd &&
    proto === "http" &&
    !currentHost.includes("localhost") &&
    !currentHost.includes("127.0.0.1")
  ) {
    const targetHost = canonicalHost || currentHost;
    const redirectUrl = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `https://${targetHost}`
    );
    return NextResponse.redirect(redirectUrl, 301);
  }

  return null;
}

export function middleware(request: NextRequest) {
  // 1. Check canonical host and HTTPS redirects first
  const canonicalRedirect = getCanonicalRedirect(request);
  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  const decision = getMiddlewareDecision(request);
  const isDev = process.env.NODE_ENV === "development";
  // Production nonces let Next.js mark its own inline scripts. Next reads the
  // nonce from the request's Content-Security-Policy header, so the policy is
  // forwarded to the app as well as reported on the response.
  const nonce = isDev ? undefined : generateNonce();
  const csp = buildCsp({ isDev, nonce });

  const applySecurityHeaders = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy-Report-Only", csp);
    // HSTS: 2 years (63072000 seconds), includes all subdomains, eligible for preload list
    if (!isDev) {
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
    }
    return response;
  };

  if (decision.type === "redirect") {
    const redirectUrl = new URL(decision.redirectPath, request.url);
    const response = NextResponse.redirect(redirectUrl);
    return applySecurityHeaders(response);
  }

  const requestHeaders = new Headers(request.headers);
  if (nonce) requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/(.*)"],
};
