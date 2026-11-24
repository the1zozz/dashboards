import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideDashboards } from '@integralways/dashboards';
import { DemoSettings } from './demo-settings';
import { DemoAccess } from './plugins/demo-access';
import { DemoCatalog } from './plugins/demo-catalog';
import { DemoData } from './plugins/demo-data';
import { DemoStore } from './plugins/demo-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The whole integration: where dashboards are kept, where numbers come from, what can be counted, who may edit.
    provideDashboards({
      store: DemoStore,
      data: DemoData,
      fields: DemoCatalog,
      access: DemoAccess,
      language: () => inject(DemoSettings).language(),
    }),
  ],
};
