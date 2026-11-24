import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getCSRFToken, getCSRFTokenHeader, refreshCSRFToken } from "@/utils/csrfToken";
import { isRetryableError, calculateBackoff } from "@/utils/retry";
import { apiMonitor } from "@/utils/apiPerformanceMonitor";
import { API_PROXY_BASE_URL, endSession } from "@/api/session";
import { newRequestId, REQUEST_ID_HEADER, requestIdFromHeaders } from "@/api/requestId";
import { clearQueryCache } from "@/api/queryClientInstance";

/**
 * Ends the browser session. The access token lives in an httpOnly cookie that
 * only the server can clear, so this asks the server to do it.
 *
 * Also drops cached dashboard data (#576) so a forced sign-out (401) can
 * never leave the previous artist's earnings/messages in memory for whoever
 * signs in next.
 */
export function clearSession(): void {
  clearQueryCache();
  void endSession();
}

/**
 * Credential endpoints where a 401 means a wrong password or code. Treating it
 * as an expired session would redirect to /login in the middle of the attempt.
 */
const CREDENTIAL_PATHS = [
  "/auth/login",
  "/auth/login-email",
  "/auth/register-email",
  "/auth/2fa/validate",
  "/auth/2fa/verify",
  "/auth/2fa/disable",
];

function isCredentialRequest(url?: string): boolean {
  if (!url) return false;
  return CREDENTIAL_PATHS.includes(url.split("?")[0]);
}

// Normalized error shape exposed to callers / React Query
export class ApiError extends Error {
  status: number;
  code?: string;
  /**
   * Correlation id for this call, from `x-request-id` on the response or the
   * one this client generated for the request (OBS-04). It is what a user
   * quotes to support, so the error toast shows it.
   */
  requestId?: string;

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function extractApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axErr = error as AxiosError<{ message?: string; error?: string; code?: string }>;
    const data = axErr.response?.data;
    const status = axErr.response?.status ?? 0;
    const message = data?.message ?? data?.error ?? axErr.message;
    const code = data?.code;
    // Prefer the id the backend echoed; fall back to the one this client sent.
    const requestId =
      requestIdFromHeaders(axErr.response?.headers) ??
      (axErr.config as TrackedConfig | undefined)?._requestId;
    return new ApiError(message, status, code, requestId);
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }
  return new ApiError("Unknown error", 0);
}

// Guard against firing concurrent redirects / clears for 401
let redirecting = false;

/** Reset the in-flight redirect flag — call this in test teardown. */
export function resetRedirectState(): void {
  redirecting = false;
}

/** Per-request config fields this module stamps onto the axios config. */
type TrackedConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  /** Opt-in for automatic retry on a non-idempotent method (#574). */
  retry?: boolean;
  /** Set once a request is replayed after the proxy refreshed the session. */
  _sessionRetried?: boolean;
  /** High-resolution timestamp set when the request left the client (#163). */
  _perfStart?: number;
  /** Correlation id sent as `x-request-id`, reused across retries (OBS-04). */
  _requestId?: string;
};

const now = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Records the round-trip time of one attempt with the API performance monitor. */
function recordTiming(config: TrackedConfig | undefined): void {
  if (!config || typeof config._perfStart !== "number") return;
  const endpoint = config.url ?? "unknown";
  const method = (config.method ?? "GET").toUpperCase();
  apiMonitor.record(endpoint, method, now() - config._perfStart);
}

export const createApiClient = async (): Promise<AxiosInstance> => {
  // Requests go to the same-origin proxy, which attaches the httpOnly access
  // token server-side (#521). Nothing auth-related is read in the browser.
  const apiClient = axios.create({
    baseURL: API_PROXY_BASE_URL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Add CSRF token for state-changing requests
    const method = config.method?.toUpperCase();
    if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const csrfHeaders = getCSRFTokenHeader();
      Object.assign(config.headers, csrfHeaders);
    }

    // Stamp the start time so the response / error interceptor can measure the
    // round trip (#163). Each retry attempt is timed separately.
    (config as TrackedConfig)._perfStart = now();

    // OBS-04: one correlation id per logical request. A retry replays this
    // config, so the id it already carries is kept rather than regenerated.
    const tracked = config as TrackedConfig;
    tracked._requestId = tracked._requestId ?? newRequestId();
    if (typeof config.headers?.set === "function") {
      config.headers.set(REQUEST_ID_HEADER, tracked._requestId);
    } else {
      Object.assign(config.headers, { [REQUEST_ID_HEADER]: tracked._requestId });
    }

    return config;
  });

  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      recordTiming(response.config as TrackedConfig);

      // Handle CSRF token refresh from server
      const newCsrfToken = response.headers["x-csrf-token"] as string | undefined;
      if (newCsrfToken && typeof newCsrfToken === "string") {
        refreshCSRFToken();
      }
      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as TrackedConfig | undefined;

      recordTiming(config);

      // Handle CSRF token validation errors
      if (error.response?.status === 403 && typeof window !== "undefined") {
        const errorData = error.response.data as Record<string, unknown>;
        if (
          errorData?.code === "CSRF_TOKEN_INVALID" ||
          (typeof errorData?.message === "string" && errorData.message.includes("CSRF"))
        ) {
          refreshCSRFToken();
          return Promise.reject(extractApiError(error));
        }
      }

      if (error.response?.status === 401 && typeof window !== "undefined") {
        // The proxy renewed the session but could not replay a streamed upload.
        // Replay it once; the body is re-sendable on the client.
        if (
          error.response.headers["x-session-refreshed"] === "1" &&
          config &&
          !config._sessionRetried
        ) {
          config._sessionRetried = true;
          return apiClient(config);
        }

        if (!redirecting && !isCredentialRequest(config?.url)) {
          redirecting = true;
          clearSession();
          // Preserve the page the artist was on (#575) so a sign-in returns
          // them there instead of always landing on /dashboard.
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?returnTo=${returnTo}`;
          // Reset flag after redirect attempt
          setTimeout(() => {
            redirecting = false;
          }, 0);
        }
      }

      // Retry logic for transient failures (#574): only safe/idempotent
      // methods retry automatically, up to maxRetries total — `_retryCount`
      // alone gates this now, so a 3rd/4th attempt is no longer skipped.
      const method = (config?.method ?? "get").toUpperCase();
      const retryEligible = ["GET", "HEAD", "OPTIONS"].includes(method) || config?.retry === true;
      if (isRetryableError(error) && config && retryEligible) {
        const maxRetries = 3;
        const retryCount = config._retryCount || 0;

        if (retryCount < maxRetries) {
          config._retryCount = retryCount + 1;
          const delay = calculateBackoff(retryCount + 1, 1000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return apiClient(config);
        }
      }

      return Promise.reject(extractApiError(error));
    }
  );

  return apiClient;
};
