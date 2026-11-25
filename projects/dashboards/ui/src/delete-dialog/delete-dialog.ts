import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DASHBOARD_STORE, DashboardSummary, settle } from '@integralways/dashboards';
import { DashI18n } from '../i18n/dash-i18n';

/** Asks before deleting a dashboard, says when others lose it too, and deletes it. Closes with true once deleted. */
@Component({
  selector: 'dash-delete-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delete-dialog.html',
  styleUrl: './delete-dialog.scss',
})
export class DeleteDialog {
  protected readonly dashboard = inject<DashboardSummary>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly store = inject(DASHBOARD_STORE);
  protected readonly i18n = inject(DashI18n);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected async confirm(): Promise<void> {
    this.busy.set(true);
    this.failed.set(false);
    try {
      await settle<void>(this.store.remove(this.dashboard.id));
      this.ref.close(true);
    } catch {
      this.failed.set(true);
      this.busy.set(false);
    }
  }

  protected close(): void {
    this.ref.close();
  }
}
