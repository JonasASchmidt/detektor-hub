/**
 * Generates a finding name from a session naming scheme.
 * Copied from apps/web/lib/namingScheme.ts — keep in sync.
 *
 * Supported tokens:
 *   {session}   – session name (as-is)
 *   {n}         – sequential finding number within the session
 *   {n:03}      – same, zero-padded to 3 digits (e.g. 001)
 *   {date}      – date in YYYY-MM-DD format
 */
export function applyNamingScheme(
  scheme: string,
  sessionName: string,
  findingNumber: number,
  date: Date = new Date()
): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  return scheme
    .replace(/\{session\}/g, sessionName)
    .replace(/\{date\}/g, dateStr)
    .replace(/\{n(?::(\d+))?\}/g, (_match, pad?: string) => {
      const num = findingNumber.toString();
      return pad ? num.padStart(parseInt(pad, 10), "0") : num;
    });
}
