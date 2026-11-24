import { Injectable } from '@angular/core';
import { DashboardAccess, DashboardSummary } from '@integralways/dashboards';

/** In the demo everyone may do everything, except edit a built-in dashboard (copy it instead). */
@Injectable()
export class DemoAccess implements DashboardAccess {
  canCreate(): boolean {
    return true;
  }

  canEdit(dashboard: DashboardSummary): boolean {
    return !dashboard.builtIn;
  }

  canShare(dashboard: DashboardSummary): boolean {
    return !dashboard.builtIn;
  }
}
