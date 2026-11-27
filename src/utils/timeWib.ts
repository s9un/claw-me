/**
 * Returns current date string (YYYY-MM-DD) in GMT+7 (Asia/Jakarta).
 */
export function getTodayWibDateString(): string {
  const now = new Date();
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wibTime.toISOString().slice(0, 10);
}

/**
 * Returns human-readable countdown to next 00:00 AM GMT+7 reset.
 */
export function getTimeUntilWibMidnight(): string {
  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const nextMidnight = new Date(wibNow);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  const diffMs = Math.max(0, nextMidnight.getTime() - wibNow.getTime());
  const hrs = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hrs}j ${mins}m`;
}
