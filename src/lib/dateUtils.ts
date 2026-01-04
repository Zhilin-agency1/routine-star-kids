/**
 * Unified date/time utilities for consistent local timezone handling.
 * All functions operate in the user's local timezone unless otherwise specified.
 */

import { format, startOfWeek as dateFnsStartOfWeek, endOfWeek as dateFnsEndOfWeek, startOfMonth, endOfMonth, addDays, parseISO, type Locale } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

/**
 * Get the current date/time in user's local timezone.
 * Use this instead of scattered `new Date()` calls for consistency.
 */
export function getNow(): Date {
  return new Date();
}

/**
 * Get today's date at midnight in local timezone.
 */
export function getToday(): Date {
  const now = getNow();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Convert a Date to YYYY-MM-DD string in LOCAL timezone.
 * Use for storing day-only entities (tasks, templates applied to a day).
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date at local midnight.
 * Inverse of toLocalDateString.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the locale object for date-fns based on language code.
 */
export function getDateLocale(language: 'ru' | 'en'): Locale {
  return language === 'ru' ? ru : enUS;
}

/**
 * Format a date for display using the user's locale.
 * @param date - The date to format
 * @param formatStr - date-fns format string
 * @param language - 'ru' or 'en'
 */
export function formatLocalDate(date: Date, formatStr: string, language: 'ru' | 'en' = 'en'): string {
  return format(date, formatStr, { locale: getDateLocale(language) });
}

/**
 * Get start of week (Monday) for a given date in local timezone.
 */
export function startOfWeekLocal(date: Date): Date {
  return dateFnsStartOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Get end of week (Sunday) for a given date in local timezone.
 */
export function endOfWeekLocal(date: Date): Date {
  return dateFnsEndOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Get start of month for a given date in local timezone.
 */
export function startOfMonthLocal(date: Date): Date {
  return startOfMonth(date);
}

/**
 * Get end of month for a given date in local timezone.
 */
export function endOfMonthLocal(date: Date): Date {
  return endOfMonth(date);
}

/**
 * Check if two dates are on the same day in local timezone.
 */
export function isSameLocalDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today in local timezone.
 */
export function isToday(date: Date): boolean {
  return isSameLocalDay(date, getNow());
}

/**
 * Get day of week (0 = Monday, 6 = Sunday) for consistent week handling.
 */
export function getDayOfWeekMondayBased(date: Date): number {
  const day = date.getDay(); // 0 = Sunday
  return (day + 6) % 7; // Convert to Monday = 0
}

/**
 * Generate an array of dates for a week starting from Monday.
 */
export function getWeekDates(date: Date): Date[] {
  const start = startOfWeekLocal(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Get the start and end datetime strings for querying a specific local day.
 * Returns strings suitable for Supabase queries.
 */
export function getDayRange(date: Date): { start: string; end: string } {
  const dateStr = toLocalDateString(date);
  return {
    start: `${dateStr}T00:00:00`,
    end: `${dateStr}T23:59:59.999`
  };
}

/**
 * Get the start and end datetime strings for querying a date range.
 */
export function getDateRangeStrings(startDate: Date, endDate: Date): { start: string; end: string } {
  return {
    start: `${toLocalDateString(startDate)}T00:00:00`,
    end: `${toLocalDateString(endDate)}T23:59:59.999`
  };
}

/**
 * Parse an ISO timestamp and return it as a local Date.
 * Useful for converting stored timestamps to display dates.
 */
export function parseTimestamp(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Extract just the date part from an ISO timestamp in local timezone.
 */
export function getLocalDateFromTimestamp(isoString: string): Date {
  const date = parseISO(isoString);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
