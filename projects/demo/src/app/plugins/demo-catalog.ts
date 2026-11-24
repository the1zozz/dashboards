import { Injectable } from '@angular/core';
import { Field, FieldCatalog, Measurable } from '@integralways/dashboards';

/** Made-up things to measure, for the demo only. */
export const COUNTRIES = ['EG', 'SA', 'AE', 'GB', 'DE', 'US'];
export const CHANNELS = ['direct', 'search', 'email', 'social', 'referral'];
export const PLANS = ['free', 'team', 'business'];

const common: Field[] = [
  { name: 'country', label: 'Country', type: 'text', values: COUNTRIES },
  { name: 'channel', label: 'Channel', type: 'text', values: CHANNELS },
];

@Injectable()
export class DemoCatalog implements FieldCatalog {
  measurables(): Promise<Measurable[]> {
    return Promise.resolve([
      { name: 'visit', label: 'Visits', fields: [] },
      { name: 'sign_up', label: 'Sign-ups', fields: [{ name: 'plan', label: 'Plan', type: 'text', values: PLANS }] },
      { name: 'task.completed', label: 'Tasks completed', fields: [] },
      { name: 'error', label: 'Errors', fields: [] },
      { name: 'invoice.paid', label: 'Invoices paid', fields: [{ name: 'amount', label: 'Amount', type: 'number' }] },
    ]);
  }

  commonFields(): Promise<Field[]> {
    return Promise.resolve(common);
  }
}
