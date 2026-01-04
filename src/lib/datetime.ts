/**
 * Timezone-safe datetime utilities for consistent database storage and querying.
 * All functions ensure proper UTC ISO conversion while respecting user's local timezone.
 */

/**
 * Get the start and end ISO strings for a local day, suitable for database queries.
 * Returns UTC ISO instants that represent the user's local day boundaries.
 * 
 * @param date - A Date object representing any moment in the local day
 * @returns Object with startISO and endISO strings for database queries
 */
export function toLocalDayBoundsISO(date: Date): { startISO: string; endISO: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  };
}

/**
 * Combine a local date string (YYYY-MM-DD) and time string (HH:mm or HH:mm:ss) 
 * into a proper UTC ISO string for database storage.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm or HH:mm:ss format
 * @returns UTC ISO string representing the local datetime
 */
export function combineLocalDateTimeToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const timeParts = timeStr.split(':').map(Number);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;
  const seconds = timeParts[2] || 0;
  
  const localDate = new Date(year, month - 1, day, hours, minutes, seconds);
  return localDate.toISOString();
}

/**
 * Get the YYYY-MM-DD date key for a datetime in user's local timezone.
 * Use this for grouping/matching dates by local day.
 * 
 * @param dt - Either a Date object or an ISO string
 * @returns YYYY-MM-DD string in local timezone
 */
export function localDateKey(dt: string | Date): string {
  const date = typeof dt === 'string' ? new Date(dt) : dt;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get ISO bounds for a date range (multiple days).
 * Useful for querying tasks across a month or custom range.
 * 
 * @param startDate - Start of the range
 * @param endDate - End of the range
 * @returns Object with startISO and endISO for the full range
 */
export function toDateRangeBoundsISO(startDate: Date, endDate: Date): { startISO: string; endISO: string } {
  const { startISO } = toLocalDayBoundsISO(startDate);
  const { endISO } = toLocalDayBoundsISO(endDate);
  return { startISO, endISO };
}
