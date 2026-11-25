import { DashboardFilters, Period, QueryDocument, WidgetResult } from '../contract/model';
import { periodRange } from './filters';

const DAY_MS = 86_400_000;

/**
 * The query a widget actually runs: its own conditions plus the dashboard's (both apply), and its own period when it
 * has one, else the dashboard's. A widget never loses a condition of its own to the filter bar. An automatic interval
 * becomes the one that suits the period.
 */
export function applyFilters(query: QueryDocument, filters: DashboardFilters, now: Date = new Date()): QueryDocument {
  const period = query.period ?? filters.period;
  const run: QueryDocument = { ...query, where: [...filters.where, ...query.where], period };
  if (query.interval === 'auto') {
    run.interval = autoInterval(period, now);
  }
  return run;
}

/** The interval that suits a period: a line of tens of points, not two and not a thousand. */
export function autoInterval(period: Period, now: Date = new Date()): 'hour' | 'day' | 'week' | 'month' {
  const [from, to] = periodRange(period, now);
  const days = (to - from) / DAY_MS;
  return days <= 2 ? 'hour' : days <= 92 ? 'day' : days <= 366 ? 'week' : 'month';
}

/** Whether a result has nothing to draw: no buckets or no rows. A number, even 0, is something. */
export function isEmpty(result: WidgetResult): boolean {
  switch (result.kind) {
    case 'series':
      return result.buckets.length === 0 || result.series.length === 0;
    case 'table':
      return result.rows.length === 0;
    default:
      return false;
  }
}
