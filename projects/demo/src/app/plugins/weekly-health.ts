import { Dashboard } from '@integralways/dashboards';

/** The demo's sample dashboard: every built-in widget type, and one widget the reader may not see. */
export const WEEKLY_HEALTH: Dashboard = {
  id: 'weekly-health',
  name: 'Weekly health',
  description: 'How the product did this week, made-up numbers.',
  visibility: 'workspace',
  ownerName: 'Demo',
  updatedAt: '2026-11-24T09:00:00Z',
  version: 1,
  filters: { period: { last: 7, unit: 'day' }, compare: 'previous', where: [] },
  widgets: [
    { id: 'w1', type: 'number', title: 'Visits', query: { measure: { aggregate: 'count', of: 'visit' }, where: [] },
      settings: {}, position: { x: 0, y: 0, w: 3, h: 2 } },
    { id: 'w2', type: 'number', title: 'Sign-ups', query: { measure: { aggregate: 'count', of: 'sign_up' }, where: [] },
      settings: {}, position: { x: 3, y: 0, w: 3, h: 2 } },
    { id: 'w3', type: 'number', title: 'Tasks completed', query: { measure: { aggregate: 'count', of: 'task.completed' }, where: [] },
      settings: {}, position: { x: 6, y: 0, w: 3, h: 2 } },
    { id: 'w4', type: 'number', title: 'Errors', query: { measure: { aggregate: 'count', of: 'error' }, where: [] },
      settings: { higherIsBetter: false }, position: { x: 9, y: 0, w: 3, h: 2 } },
    { id: 'w5', type: 'trend', title: 'Visits per day', query: { measure: { aggregate: 'count', of: 'visit' }, where: [], interval: 'day' },
      settings: {}, position: { x: 0, y: 2, w: 8, h: 4 } },
    { id: 'w6', type: 'note', title: 'About this dashboard', settings: {
      text: 'Made-up numbers from the demo app: no server and no Observa code.\n\nThe top row compares this week with the previous one. Errors going down shows as good.' },
      position: { x: 8, y: 2, w: 4, h: 4 } },
    { id: 'w7', type: 'breakdown', title: 'Sign-ups by country', query: { measure: { aggregate: 'count', of: 'sign_up' }, where: [], by: 'country', limit: 6 },
      settings: {}, position: { x: 0, y: 6, w: 4, h: 4 } },
    { id: 'w8', type: 'table', title: 'Visits by channel', query: { measure: { aggregate: 'count', of: 'visit' }, where: [], by: 'channel' },
      settings: {}, position: { x: 4, y: 6, w: 4, h: 4 } },
    { id: 'w9', type: 'number', title: 'Invoices paid', query: { measure: { aggregate: 'sum', of: 'invoice.paid', field: 'amount' }, where: [] },
      settings: { unit: 'USD' }, position: { x: 8, y: 6, w: 4, h: 4 } },
  ],
};
