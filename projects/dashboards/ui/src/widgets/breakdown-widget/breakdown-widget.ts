import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { WidgetView } from '@integralways/dashboards';
import { Chart, ChartSpec } from '../../chart/chart';

/** Bars split by one field, largest first, growing sideways so long values stay readable. */
@Component({
  selector: 'dash-breakdown-widget',
  imports: [Chart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breakdown-widget.html',
  styleUrl: './breakdown-widget.scss',
})
export class BreakdownWidget {
  readonly view = input.required<WidgetView>();

  protected readonly spec = computed<ChartSpec | null>(() => {
    const r = this.view().result;
    if (r?.kind !== 'series' || r.series.length === 0) {
      return null;
    }
    // Largest first, by the first series.
    const order = r.buckets.map((_, i) => i).sort((a, b) => r.series[0].values[b] - r.series[0].values[a]);
    return {
      kind: 'bar',
      horizontal: true,
      buckets: order.map((i) => r.buckets[i]),
      series: r.series.map((s) => ({ name: s.name, values: order.map((i) => s.values[i]) })),
    };
  });
}
