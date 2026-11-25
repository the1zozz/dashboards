import { describe, expect, it } from 'vitest';
import { DashboardFilters } from '../contract/model';
import { datesPeriod, periodDays, periodRange, sameFilters, samePeriod } from './filters';

const base: DashboardFilters = { period: { last: 7, unit: 'day' }, compare: 'previous', where: [{ field: 'country', op: 'eq', value: 'EG' }] };

describe('datesPeriod', () => {
  it('includes the last day: the period ends at the start of the day after', () => {
    expect(datesPeriod('2026-11-01', '2026-11-07')).toEqual({ from: '2026-11-01T00:00:00.000Z', to: '2026-11-08T00:00:00.000Z' });
    expect(datesPeriod('2026-11-07', '2026-11-07')).toEqual({ from: '2026-11-07T00:00:00.000Z', to: '2026-11-08T00:00:00.000Z' });
  });

  it('refuses a missing day and a last day before the first', () => {
    expect(datesPeriod('', '2026-11-07')).toBeNull();
    expect(datesPeriod('2026-11-08', '2026-11-07')).toBeNull();
  });

  it('gives back the days it was made from', () => {
    expect(periodDays(datesPeriod('2026-02-27', '2026-03-02')!)).toEqual({ first: '2026-02-27', last: '2026-03-02' });
  });
});

describe('periodRange and periodDays', () => {
  const now = new Date('2026-11-25T10:00:00Z');

  it('ends a rolling period now', () => {
    expect(periodRange({ last: 24, unit: 'hour' }, now)).toEqual([Date.parse('2026-11-24T10:00:00Z'), now.getTime()]);
    expect(periodDays({ last: 7, unit: 'day' }, now)).toEqual({ first: '2026-11-19', last: '2026-11-25' });
    expect(periodDays({ last: 24, unit: 'hour' }, now)).toEqual({ first: '2026-11-25', last: '2026-11-25' });
  });

  it('counts months on the calendar', () => {
    expect(periodDays({ last: 12, unit: 'month' }, now).first).toBe('2025-11-26');
  });
});

describe('sameFilters', () => {
  it('compares period, comparison and conditions', () => {
    expect(sameFilters(base, structuredClone(base))).toBe(true);
    expect(sameFilters(base, { ...base, compare: 'none' })).toBe(false);
    expect(sameFilters(base, { ...base, period: { last: 30, unit: 'day' } })).toBe(false);
    expect(sameFilters(base, { ...base, where: [{ field: 'country', op: 'eq', value: 'SA' }] })).toBe(false);
  });

  it('treats the same instant written two ways as the same period', () => {
    expect(samePeriod({ from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z' },
      { from: '2026-11-01T00:00:00.000Z', to: '2026-11-02T00:00:00.000Z' })).toBe(true);
  });
});
