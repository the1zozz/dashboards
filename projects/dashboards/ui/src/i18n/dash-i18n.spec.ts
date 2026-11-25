import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DASHBOARD_LANGUAGE } from '@integralways/dashboards';
import { DashI18n } from './dash-i18n';

function i18n(language: string): DashI18n {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: DASHBOARD_LANGUAGE, useValue: () => language }] });
  return TestBed.inject(DashI18n);
}

describe('DashI18n.ago', () => {
  const now = Date.parse('2026-11-25T12:00:00Z');

  it('says how long ago in words, in the largest unit that fits', () => {
    const en = i18n('en');
    expect(en.ago('2026-11-25T11:59:40Z', now)).toBe('now');
    expect(en.ago('2026-11-25T11:55:00Z', now)).toBe('5 minutes ago');
    expect(en.ago('2026-11-25T09:00:00Z', now)).toBe('3 hours ago');
    expect(en.ago('2026-11-24T12:00:00Z', now)).toBe('yesterday');
    expect(en.ago('2026-11-11T12:00:00Z', now)).toBe('2 weeks ago');
    expect(en.ago('2026-08-25T12:00:00Z', now)).toBe('3 months ago');
    expect(en.ago('2024-11-25T12:00:00Z', now)).toBe('2 years ago');
  });

  it('a clock a little ahead is still now, not the future', () => {
    expect(i18n('en').ago('2026-11-25T12:00:20Z', now)).toBe('now');
  });

  it('in Arabic, with Arabic words', () => {
    expect(i18n('ar').ago('2026-11-24T12:00:00Z', now)).toBe('أمس');
  });
});
