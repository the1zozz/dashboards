import { Injectable } from '@angular/core';
import { Period, QueryContext, QueryDocument, WidgetDataSource, WidgetResult } from '@integralways/dashboards';
import { CHANNELS, COUNTRIES, PLANS } from './demo-catalog';

/** Values of a field the demo can split by. */
const VALUES: Record<string, string[]> = { country: COUNTRIES, channel: CHANNELS, plan: PLANS };
/** Typical daily size of each measure, so the made-up numbers look plausible. */
const SCALE: Record<string, number> = { visit: 1800, sign_up: 90, 'task.completed': 420, error: 14, 'invoice.paid': 35 };
/** How the demo names each measure in a series or column. */
const LABELS: Record<string, { en: string; ar: string }> = {
  visit: { en: 'Visits', ar: 'الزيارات' }, sign_up: { en: 'Sign-ups', ar: 'التسجيلات' },
  'task.completed': { en: 'Tasks completed', ar: 'المهام المنجزة' }, error: { en: 'Errors', ar: 'الأخطاء' },
  'invoice.paid': { en: 'Invoices paid', ar: 'الفواتير المدفوعة' },
};
/** What the demo's reader may not see: shows the "no access" state. */
const RESTRICTED = new Set(['invoice.paid']);

/**
 * Made-up numbers for the demo: the same query always gives the same answer (seeded by the query), after a short
 * delay so the loading state shows. No server, no Observa.
 */
@Injectable()
export class DemoData implements WidgetDataSource {
  async run(query: QueryDocument, context: QueryContext): Promise<WidgetResult> {
    await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 650));
    if (RESTRICTED.has(query.measure.of)) {
      return { kind: 'noAccess' };
    }
    const random = seeded(JSON.stringify(query) + context.compare);
    const days = daysOf(query.period);
    const daily = (SCALE[query.measure.of] ?? 100) * (query.measure.aggregate === 'unique' ? 0.6 : 1);
    const narrowed = query.where.length ? 0.35 : 1;

    if (query.interval) {
      const buckets = lastDays(days, context.language);
      const values = buckets.map((_, i) => Math.round(daily * narrowed * (0.75 + random() * 0.5) * (1 + (i % 7 >= 5 ? -0.25 : 0))));
      const series = [{ name: context.language === 'ar' ? 'هذه الفترة' : 'This period', values }];
      if (context.compare === 'previous') {
        series.push({ name: context.language === 'ar' ? 'الفترة السابقة' : 'Previous period',
          values: values.map((v) => Math.round(v * (0.8 + random() * 0.3))) });
      }
      return { kind: 'series', buckets, series };
    }
    if (query.by) {
      const values = VALUES[query.by] ?? [];
      const limited = values.slice(0, query.limit ?? values.length);
      return {
        kind: 'series',
        buckets: limited,
        series: [{ name: LABELS[query.measure.of]?.[context.language === 'ar' ? 'ar' : 'en'] ?? query.measure.of, values: limited.map((_, i) => Math.round(daily * days * narrowed * (0.6 / (i + 1)) * (0.8 + random() * 0.4))) }],
      };
    }
    const value = Math.round(daily * days * narrowed * (0.85 + random() * 0.3));
    return { kind: 'number', value, previous: context.compare === 'previous' ? Math.round(value * (0.75 + random() * 0.45)) : undefined };
  }
}

function daysOf(period: Period | undefined): number {
  if (!period) {
    return 7;
  }
  if ('last' in period) {
    return Math.max(1, Math.min(90, period.last * ({ hour: 1 / 24, day: 1, week: 7, month: 30 }[period.unit])));
  }
  return Math.max(1, Math.round((Date.parse(period.to) - Date.parse(period.from)) / 86_400_000));
}

function lastDays(days: number, language: string): string[] {
  const format = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
  const today = new Date();
  return Array.from({ length: Math.round(days) }, (_, i) => format.format(new Date(today.getTime() - (days - 1 - i) * 86_400_000)));
}

/** A small seeded random generator (mulberry32 over a string hash). */
function seeded(text: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
