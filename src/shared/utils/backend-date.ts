/**
 * Backend LocalDateTime fields (e.g. Order.expiresAt) serialize as naive
 * ISO strings with no timezone offset, but represent UTC instants (the
 * server runs in UTC). Without a "Z"/offset suffix, `new Date(...)` parses
 * the string as browser-local time instead, shifting the value by the
 * browser's UTC offset. Always parse backend timestamps through this helper.
 */
export function parseBackendDate(isoString: string): Date {
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(isoString);
  return new Date(hasTimezone ? isoString : `${isoString}Z`);
}
