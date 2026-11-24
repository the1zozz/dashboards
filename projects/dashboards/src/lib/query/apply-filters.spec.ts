import { describe, expect, it } from 'vitest';
import { DashboardFilters, QueryDocument } from '../contract/model';
import { applyFilters, isEmpty } from './apply-filters';

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

describe('isEmpty', () => {
  it('treats zero as a number, and no buckets or rows as nothing', () => {
    expect(isEmpty({ kind: 'number', value: 0 })).toBe(false);
    expect(isEmpty({ kind: 'series', buckets: [], series: [] })).toBe(true);
    expect(isEmpty({ kind: 'table', columns: ['a'], rows: [] })).toBe(true);
    expect(isEmpty({ kind: 'noAccess' })).toBe(false);
  });
});
