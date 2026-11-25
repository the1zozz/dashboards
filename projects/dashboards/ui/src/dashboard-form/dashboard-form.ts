import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Dashboard, DASHBOARD_STORE, DashboardSummary, settle } from '@integralways/dashboards';
import { DashI18n } from '../i18n/dash-i18n';

/** A new dashboard (source null), or a copy of {@link source}. */
export interface DashboardFormData {
  source: DashboardSummary | null;
}

/** The longest name and description the form takes; a project's server may take fewer. */
export const NAME_MAX = 120;
export const DESCRIPTION_MAX = 500;

/**
 * Names a new dashboard, or a copy of one, and makes it in the project's store. Closes with the dashboard made, or
 * with nothing on cancel. A failure stays in the dialog with what was typed.
 */
@Component({
  selector: 'dash-dashboard-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-form.html',
  styleUrl: './dashboard-form.scss',
})
export class DashboardForm {
  protected readonly data = inject<DashboardFormData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<Dashboard>>(DialogRef);
  private readonly store = inject(DASHBOARD_STORE);
  protected readonly i18n = inject(DashI18n);

  protected readonly nameMax = NAME_MAX;
  protected readonly descriptionMax = DESCRIPTION_MAX;
  protected readonly copying = this.data.source !== null;
  protected readonly name = signal(this.data.source ? this.i18n.t('board.copyTitle', { title: this.data.source.name }) : '');
  protected readonly description = signal(this.data.source?.description ?? '');
  protected readonly tried = signal(false);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly nameMissing = computed(() => this.name().trim() === '');

  protected async submit(): Promise<void> {
    this.tried.set(true);
    if (this.nameMissing() || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.failed.set(false);
    const name = this.name().trim();
    try {
      const made = this.data.source
        ? await settle<Dashboard>(this.store.copy(this.data.source.id, name))
        : await settle<Dashboard>(this.store.create(name, this.description().trim() || undefined));
      this.ref.close(made);
    } catch {
      this.failed.set(true);
      this.busy.set(false);
    }
  }

  protected close(): void {
    this.ref.close();
  }
}
