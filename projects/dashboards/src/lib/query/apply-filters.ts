import { DashboardFilters, QueryDocument, WidgetResult } from '../contract/model';

/**
 * The query a widget actually runs: its own conditions plus the dashboard's (both apply), and its own period when it
 * has one, else the dashboard's. A widget never loses a condition of its own to the filter bar.
 */
export function applyFilters(query: QueryDocument, filters: DashboardFilters): QueryDocument {
  return {
    ...query,
    where: [...filters.where, ...query.where],
    period: query.period ?? filters.period,
  };
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
