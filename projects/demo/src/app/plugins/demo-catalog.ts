import { inject, Injectable } from '@angular/core';
import { Field, FieldCatalog, Measurable } from '@integralways/dashboards';
import { DemoSettings } from '../demo-settings';

/** Made-up things to measure, for the demo only. */
export const COUNTRIES = ['EG', 'SA', 'AE', 'GB', 'DE', 'US'];
export const CHANNELS = ['direct', 'search', 'email', 'social', 'referral'];
export const PLANS = ['free', 'team', 'business'];

/** Labels in the reader's language, as the contract asks of a catalog. */
const LABELS = {
  en: { visit: 'Visits', sign_up: 'Sign-ups', task: 'Tasks completed', error: 'Errors', invoice: 'Invoices paid',
    plan: 'Plan', amount: 'Amount', country: 'Country', channel: 'Channel' },
  ar: { visit: 'الزيارات', sign_up: 'التسجيلات', task: 'المهام المنجزة', error: 'الأخطاء', invoice: 'الفواتير المدفوعة',
    plan: 'الخطة', amount: 'المبلغ', country: 'الدولة', channel: 'القناة' },
};

@Injectable()
export class DemoCatalog implements FieldCatalog {
  private readonly settings = inject(DemoSettings);

  measurables(): Promise<Measurable[]> {
    const l = LABELS[this.settings.language()];
    return Promise.resolve([
      { name: 'visit', label: l.visit, fields: [] },
      { name: 'sign_up', label: l.sign_up, fields: [{ name: 'plan', label: l.plan, type: 'text', values: PLANS }] },
      { name: 'task.completed', label: l.task, fields: [] },
      { name: 'error', label: l.error, fields: [] },
      { name: 'invoice.paid', label: l.invoice, fields: [{ name: 'amount', label: l.amount, type: 'number' }] },
    ]);
  }

  commonFields(): Promise<Field[]> {
    const l = LABELS[this.settings.language()];
    return Promise.resolve([
      { name: 'country', label: l.country, type: 'text', values: COUNTRIES },
      { name: 'channel', label: l.channel, type: 'text', values: CHANNELS },
    ]);
  }
}
