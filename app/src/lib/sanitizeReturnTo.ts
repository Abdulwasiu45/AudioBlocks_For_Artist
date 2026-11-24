/**
 * Validate that `path` is a safe, same-origin relative URL before using it
 * in a redirect.  Accepts any path that starts with "/" but rejects:
 *   - non-string values
 *   - empty strings
 *   - protocol-relative URLs (`//evil.com`, `/\evil.com`)
 *   - everything that does not start with "/"
 *
 * Returns `/dashboard` for any rejected value so callers always have a safe
 * fallback without branching.
 *
 * @example
 *   sanitizeReturnTo("/dashboard/overview")  // "/dashboard/overview"
 *   sanitizeReturnTo("//evil.com")            // "/dashboard"
 *   sanitizeReturnTo("https://evil.com")      // "/dashboard"
 */
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
