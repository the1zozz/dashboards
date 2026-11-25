import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { DashboardSummary } from '@integralways/dashboards';
import { DashboardActions } from '../actions/dashboard-actions';
import { DashI18n } from '../i18n/dash-i18n';
import { VisibilityBadge } from '../visibility-badge/visibility-badge';

/** How a card asks to open its dashboard: the click (null from the menu), and whether to edit. */
export interface CardOpen {
  event: MouseEvent | null;
  edit: boolean;
}

/**
 * One dashboard in the list: its name (the card's link), description, who can see it, owner and last change, and a
 * menu of what the reader may do with it. It only says what was chosen; the list does it.
 */
@Component({
  selector: 'dash-dashboard-card',
  imports: [CdkMenu, CdkMenuItem, CdkMenuTrigger, VisibilityBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-card.html',
  styleUrl: './dashboard-card.scss',
})
export class DashboardCard {
  readonly dashboard = input.required<DashboardSummary>();
  /** Its page's address; null draws the name as a button. */
  readonly href = input<string | null>(null);

  readonly opened = output<CardOpen>();
  readonly copy = output<void>();
  readonly share = output<void>();
  readonly remove = output<void>();

  protected readonly i18n = inject(DashI18n);
  protected readonly actions = inject(DashboardActions);
}
