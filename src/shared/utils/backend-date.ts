/**
 * Backend LocalDateTime fields (e.g. Order.expiresAt) serialize as naive
 * ISO strings with no timezone offset. The server container runs with
 * TZ=Asia/Ho_Chi_Minh, so these naive strings already represent VN-local
 * wall-clock time — the same timezone the browser runs in for this app's
 * users. `new Date(...)` parses a no-offset ISO string as browser-local
 * time by default, which is already correct here; do not append "Z" (that
 * would mislabel it as UTC and double-shift it by the VN UTC+7 offset).
 * Always parse backend timestamps through this helper for consistency.
 */
export function parseBackendDate(isoString: string): Date {
  return new Date(isoString);
}
