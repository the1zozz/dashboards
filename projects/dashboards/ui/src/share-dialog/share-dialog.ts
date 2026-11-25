import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Dashboard, DASHBOARD_STORE, DashboardSummary, settle, Visibility } from '@integralways/dashboards';
import { DashI18n } from '../i18n/dash-i18n';

/**
 * Who can see a dashboard: only its owner, or everyone in the workspace. Closes with the dashboard as saved, or with
 * nothing when cancelled or unchanged.
 */
@Component({
  selector: 'dash-share-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.scss',
})
export class ShareDialog {
  protected readonly dashboard = inject<DashboardSummary>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<Dashboard>>(DialogRef);
  private readonly store = inject(DASHBOARD_STORE);
  private readonly announcer = inject(LiveAnnouncer);
  protected readonly i18n = inject(DashI18n);

  protected readonly choices: { value: Visibility; icon: string }[] = [
    { value: 'private', icon: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z' },
    { value: 'workspace', icon: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6' },
  ];
  protected readonly chosen = signal<Visibility>(this.dashboard.visibility);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected async save(): Promise<void> {
    if (this.chosen() === this.dashboard.visibility) {
      this.ref.close();
      return;
    }
    this.busy.set(true);
    this.failed.set(false);
    try {
      const saved = await settle<Dashboard>(this.store.share(this.dashboard.id, this.chosen()));
      this.announcer.announce(this.i18n.t(saved.visibility === 'workspace' ? 'share.doneWorkspace' : 'share.donePrivate'));
      this.ref.close(saved);
    } catch {
      this.failed.set(true);
      this.busy.set(false);
    }
  }

  protected close(): void {
    this.ref.close();
  }
}
