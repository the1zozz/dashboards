import { Condition, DashboardFilters, Period } from '../contract/model';

/** The periods the filter bar offers first, shortest first. */
export const PERIOD_PRESETS: readonly Period[] = [
  { last: 24, unit: 'hour' },
  { last: 7, unit: 'day' },
  { last: 30, unit: 'day' },
  { last: 90, unit: 'day' },
  { last: 12, unit: 'month' },
];

/** A day as the date fields hold it: yyyy-mm-dd. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function samePeriod(a: Period, b: Period): boolean {
  if ('last' in a && 'last' in b) {
    return a.last === b.last && a.unit === b.unit;
  }
  if ('from' in a && 'from' in b) {
    return Date.parse(a.from) === Date.parse(b.from) && Date.parse(a.to) === Date.parse(b.to);
  }
  return false;
}

export function sameCondition(a: Condition, b: Condition): boolean {
  return a.field === b.field && a.op === b.op && JSON.stringify(a.value) === JSON.stringify(b.value);
}

/** Whether two filter sets ask for the same thing: the same period, comparison and conditions in the same order. */
export function sameFilters(a: DashboardFilters, b: DashboardFilters): boolean {
  return samePeriod(a.period, b.period) && a.compare === b.compare
    && a.where.length === b.where.length && a.where.every((c, i) => sameCondition(c, b.where[i]));
}

/**
 * The fixed period from the first day to the last, both included, as a reader picks them. Days are whole UTC days,
 * the days a project's time buckets use. Null when a day is missing or the last is before the first.
 */
export function datesPeriod(first: string, last: string): Period | null {
  if (!DAY.test(first) || !DAY.test(last)) {
    return null;
  }
  const from = Date.parse(first + 'T00:00:00Z');
  const to = Date.parse(last + 'T00:00:00Z') + DAY_MS;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
    return null;
  }
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
}

/**
 * The first and last day of a period, both included (yyyy-mm-dd). A rolling period becomes as many whole days ending
 * today (the last 7 days: today and the 6 before), what a reader expects when they switch to fixed dates.
 */
export function periodDays(period: Period, now: Date = new Date()): { first: string; last: string } {
  const [from, to] = periodRange(period, now);
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return 'from' in period
    ? { first: day(from), last: day(Math.max(from, to - 1)) }
    : { first: day(Math.min(to, from + DAY_MS - 1)), last: day(to) };
}

/** A period as [from, to) in milliseconds; a rolling period ends now. Months are calendar months. */
export function periodRange(period: Period, now: Date = new Date()): [number, number] {
  if ('from' in period) {
    return [Date.parse(period.from), Date.parse(period.to)];
  }
  const to = now.getTime();
  if (period.unit === 'month') {
    const from = new Date(to);
    from.setUTCMonth(from.getUTCMonth() - period.last);
    return [from.getTime(), to];
  }
  const unit = { hour: 3_600_000, day: DAY_MS, week: 7 * DAY_MS }[period.unit];
  return [to - period.last * unit, to];
}
