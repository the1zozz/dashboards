import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { Dashboard, DASHBOARD_ACCESS, DashboardSummary } from '@integralways/dashboards';
import { firstValueFrom } from 'rxjs';
import { DashboardForm, DashboardFormData } from '../dashboard-form/dashboard-form';
import { DeleteDialog } from '../delete-dialog/delete-dialog';
import { DashI18n } from '../i18n/dash-i18n';
import { ShareDialog } from '../share-dialog/share-dialog';

/**
 * What can be done to a whole dashboard, each in its own dialog: make a new one, copy, share and delete. The list and
 * the board both use it, so the dialogs and who may use them are the same everywhere. Each answers with the result,
 * or undefined when the user cancelled; the store is called inside the dialog, so an error is shown where it happened.
 */
@Injectable({ providedIn: 'root' })
export class DashboardActions {
  private readonly dialog = inject(Dialog);
  private readonly access = inject(DASHBOARD_ACCESS);
  private readonly i18n = inject(DashI18n);

  canCreate(): boolean {
    return this.access.canCreate();
  }

  /** A built-in dashboard is copied, never edited. */
  canEdit(d: DashboardSummary): boolean {
    return !d.builtIn && this.access.canEdit(d);
  }

  canShare(d: DashboardSummary): boolean {
    return !d.builtIn && this.access.canShare(d);
  }

  canRemove(d: DashboardSummary): boolean {
    return !d.builtIn && (this.access.canRemove ? this.access.canRemove(d) : this.access.canShare(d));
  }

  /** A new, private dashboard. */
  create(): Promise<Dashboard | undefined> {
    return this.open<Dashboard, DashboardFormData>(DashboardForm, { source: null }, 'dash-form-title');
  }

  /** A private copy, under a name the user chooses. */
  copy(source: DashboardSummary): Promise<Dashboard | undefined> {
    return this.open<Dashboard, DashboardFormData>(DashboardForm, { source }, 'dash-form-title');
  }

  share(dashboard: DashboardSummary): Promise<Dashboard | undefined> {
    return this.open<Dashboard, DashboardSummary>(ShareDialog, dashboard, 'dash-share-title');
  }

  /** True once it is deleted. */
  async remove(dashboard: DashboardSummary): Promise<boolean> {
    return (await this.open<boolean, DashboardSummary>(DeleteDialog, dashboard, 'dash-delete-title')) === true;
  }

  private open<R, D>(component: ComponentType<unknown>, data: D, labelledBy: string): Promise<R | undefined> {
    const config: DialogConfig<D, DialogRef<R, unknown>> = {
      data,
      width: '520px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      direction: this.i18n.dir(),
      ariaLabelledBy: labelledBy,
      autoFocus: 'first-tabbable',
    };
    return firstValueFrom(this.dialog.open<R, D>(component, config).closed);
  }
}
