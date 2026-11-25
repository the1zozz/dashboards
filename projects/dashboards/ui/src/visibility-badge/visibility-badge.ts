import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DashboardSummary } from '@integralways/dashboards';
import { DashI18n } from '../i18n/dash-i18n';

const ICONS = {
  private: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
  workspace: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6',
  builtIn: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z',
};

/** Who can see a dashboard, in a word and an icon, with the sentence as its tooltip; a built-in one says so. */
@Component({
  selector: 'dash-visibility-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './visibility-badge.html',
  styleUrl: './visibility-badge.scss',
})
export class VisibilityBadge {
  readonly dashboard = input.required<Pick<DashboardSummary, 'visibility' | 'builtIn'>>();

  protected readonly i18n = inject(DashI18n);
  protected readonly kind = computed(() => (this.dashboard().builtIn ? 'builtIn' : this.dashboard().visibility));
  protected readonly icon = computed(() => ICONS[this.kind()]);
}
