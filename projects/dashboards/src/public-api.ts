/*
 * @integralways/dashboards: the contract a project implements, and provideDashboards. Light on purpose: it is what the
 * app config imports. The components are in @integralways/dashboards/ui (see CONTRACT.md).
 */
export * from './lib/contract/model';
export * from './lib/contract/plugins';
export { provideDashboards } from './lib/provide-dashboards';
export { DashI18n } from './lib/i18n/dash-i18n';
export { MESSAGES, type Language, type MessageKey } from './lib/i18n/messages';
export { applyFilters, isEmpty } from './lib/query/apply-filters';
export { settle } from './lib/query/answer';
