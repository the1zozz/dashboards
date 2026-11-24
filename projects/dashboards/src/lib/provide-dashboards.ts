import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  DASHBOARD_ACCESS,
  DASHBOARD_LANGUAGE,
  DASHBOARD_STORE,
  DashboardsConfig,
  EXTRA_WIDGETS,
  FIELD_CATALOG,
  WIDGET_DATA,
} from './contract/plugins';

/**
 * Connects the package to a project: where dashboards are saved, where the numbers come from, what can be counted,
 * who may edit, and the project's own widget types.
 *
 * ```ts
 * provideDashboards({ store: MyStore, data: MyData, fields: MyFields, access: MyAccess, language: () => lang() })
 * ```
 */
export function provideDashboards(config: DashboardsConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: DASHBOARD_STORE, useClass: config.store },
    { provide: WIDGET_DATA, useClass: config.data },
    { provide: FIELD_CATALOG, useClass: config.fields },
    { provide: DASHBOARD_ACCESS, useClass: config.access },
    { provide: EXTRA_WIDGETS, useValue: config.widgets ?? [] },
    { provide: DASHBOARD_LANGUAGE, useValue: config.language ?? (() => 'en') },
  ]);
}
