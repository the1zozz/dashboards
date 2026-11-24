/**
 * The dashboard model: what a project's store saves and loads. Plain JSON, so any backend can keep it (the optional
 * Spring Boot starter keeps it in two tables). Versioned with the package's contract: see CONTRACT.md.
 */

/** Who can open a dashboard: its owner only, or everyone in the workspace (or project) who may read dashboards. */
export type Visibility = 'private' | 'workspace';

/** A widget's place on the 12-column grid: column and row of its top-start corner, width and height in cells. */
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One widget on a dashboard. {@link type} names a widget type registered with the package or by the project. */
export interface Widget {
  id: string;
  type: string;
  title: string;
  /** What the widget shows. Absent for widgets that show no data (a note). */
  query?: QueryDocument;
  /** The widget type's own settings, e.g. a note's text or a number's unit. */
  settings: Record<string, unknown>;
  position: GridPosition;
}

/** A dashboard as the list shows it. */
export interface DashboardSummary {
  id: string;
  name: string;
  description?: string;
  visibility: Visibility;
  ownerName?: string;
  /** True for the built-in dashboard a project ships (it can be copied, not edited). */
  builtIn?: boolean;
  updatedAt: string;
}

export interface Dashboard extends DashboardSummary {
  widgets: Widget[];
  /** The filters every widget gets, unless a widget opts out. */
  filters: DashboardFilters;
  /** Incremented by the store on each save; a save with an older version is refused (two editors). */
  version: number;
}

/** The dashboard's filter bar: the period, a comparison, and field filters added on top of each widget's own. */
export interface DashboardFilters {
  period: Period;
  compare: 'none' | 'previous';
  where: Condition[];
}

/** A rolling period ending now, or fixed dates (ISO 8601, inclusive start, exclusive end). */
export type Period = { last: number; unit: 'hour' | 'day' | 'week' | 'month' } | { from: string; to: string };

// ------------------------------------------------------------------ the query document

/**
 * What a data widget asks for, independent of any database: one measure, optional conditions, optionally split by a
 * field or over time. Field names come from the project's {@link FieldCatalog}; the project turns the document into
 * its own query and enforces its own limits.
 */
export interface QueryDocument {
  measure: Measure;
  where: Condition[];
  /** Split the measure by one field (Breakdown, Table). */
  by?: string;
  /** Split it over time (Trend). */
  interval?: 'hour' | 'day' | 'week' | 'month';
  /** Most rows to return when split by a field; the project may cap it lower. */
  limit?: number;
  /** The widget's own period; when absent the dashboard's applies. */
  period?: Period;
}

/** What is counted or added up. {@link of} names the thing (e.g. an event or record type) and {@link field} a value. */
export interface Measure {
  aggregate: 'count' | 'unique' | 'sum' | 'average';
  /** The thing measured, a name from the catalog's measurables. */
  of: string;
  /** For sum and average: the numeric field added up. For unique: what is counted once (e.g. a person). */
  field?: string;
}

export interface Condition {
  field: string;
  op: 'eq' | 'neq' | 'in' | 'contains' | 'gt' | 'lt';
  value: string | number | (string | number)[];
}

// ------------------------------------------------------------------ results

/** What a project's data source answers for one widget. */
export type WidgetResult =
  | { kind: 'number'; value: number; previous?: number }
  | { kind: 'series'; buckets: string[]; series: { name: string; values: number[] }[] }
  | { kind: 'table'; columns: string[]; rows: (string | number | null)[][] }
  | { kind: 'noAccess' };
