import { describe, expect, it } from 'vitest';
import { DashboardFilters, QueryDocument } from '../contract/model';
import { applyFilters, autoInterval, isEmpty } from './apply-filters';

const filters: DashboardFilters = {
  period: { last: 7, unit: 'day' },
  compare: 'none',
  where: [{ field: 'country', op: 'eq', value: 'EG' }],
};

describe('applyFilters', () => {
  it('adds the dashboard conditions to the widget own and keeps both', () => {
    const query: QueryDocument = { measure: { aggregate: 'count', of: 'signup' }, where: [{ field: 'plan', op: 'eq', value: 'pro' }] };
    const run = applyFilters(query, filters);
    expect(run.where.map((c) => c.field)).toEqual(['country', 'plan']);
    expect(run.period).toEqual({ last: 7, unit: 'day' });
    expect(query.where).toHaveLength(1);
  });

  it('keeps a widget own period over the dashboard one', () => {
    const query: QueryDocument = { measure: { aggregate: 'count', of: 'signup' }, where: [], period: { last: 30, unit: 'day' } };
    expect(applyFilters(query, filters).period).toEqual({ last: 30, unit: 'day' });
  });
});

describe('autoInterval', () => {
  const now = new Date('2026-11-25T12:00:00Z');

  it('follows the period: hours, days, weeks, months', () => {
    expect(autoInterval({ last: 24, unit: 'hour' }, now)).toBe('hour');
    expect(autoInterval({ last: 7, unit: 'day' }, now)).toBe('day');
    expect(autoInterval({ last: 90, unit: 'day' }, now)).toBe('day');
    expect(autoInterval({ last: 12, unit: 'month' }, now)).toBe('week');
    expect(autoInterval({ from: '2024-01-01T00:00:00Z', to: '2026-01-01T00:00:00Z' }, now)).toBe('month');
  });

  it('is resolved before the data source sees the query, from the period that applies', () => {
    const query: QueryDocument = { measure: { aggregate: 'count', of: 'signup' }, where: [], interval: 'auto' };
    expect(applyFilters(query, filters, now).interval).toBe('day');
    expect(applyFilters({ ...query, period: { last: 24, unit: 'hour' } }, filters, now).interval).toBe('hour');
    expect(applyFilters({ ...query, interval: 'week' }, filters, now).interval).toBe('week');
  });
});

describe('isEmpty', () => {
  it('treats zero as a number, and no buckets or rows as nothing', () => {
    expect(isEmpty({ kind: 'number', value: 0 })).toBe(false);
    expect(isEmpty({ kind: 'series', buckets: [], series: [] })).toBe(true);
    expect(isEmpty({ kind: 'table', columns: ['a'], rows: [] })).toBe(true);
    expect(isEmpty({ kind: 'noAccess' })).toBe(false);
  });
});
