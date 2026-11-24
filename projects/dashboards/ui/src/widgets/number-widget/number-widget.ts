import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { WidgetView } from '@integralways/dashboards';
import { DashI18n } from '../../i18n/dash-i18n';

/**
 * One figure, and how it changed against the previous period. Settings: {@code unit} (shown after the figure) and
 * {@code higherIsBetter} (false for things like errors: a rise is then shown as bad). The change is said in words and
 * with an arrow, never by colour alone.
 */
@Component({
  selector: 'dash-number-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './number-widget.html',
  styleUrl: './number-widget.scss',
})
export class NumberWidget {
  readonly view = input.required<WidgetView>();
  protected readonly i18n = inject(DashI18n);

  protected readonly value = computed(() => {
    const r = this.view().result;
    return r?.kind === 'number' ? r : null;
  });
  protected readonly unit = computed(() => {
    const unit = this.view().settings['unit'];
    return typeof unit === 'string' ? unit : '';
  });
  protected readonly change = computed(() => {
    const v = this.value();
    return v ? this.i18n.change(v.value, v.previous) : null;
  });
  /** 'good', 'bad' or 'flat', from the direction and whether higher is better. */
  protected readonly tone = computed(() => {
    const v = this.value();
    if (!v || v.previous === undefined || v.value === v.previous) {
      return 'flat';
    }
    const up = v.value > v.previous;
    return up === (this.view().settings['higherIsBetter'] !== false) ? 'good' : 'bad';
  });
  protected readonly up = computed(() => {
    const v = this.value();
    return !!v && v.previous !== undefined && v.value > v.previous;
  });
}
