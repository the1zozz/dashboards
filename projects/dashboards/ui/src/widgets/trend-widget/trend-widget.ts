import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { WidgetView } from '@integralways/dashboards';
import { Chart, ChartSpec } from '../../chart/chart';

/** A line over time: one line per series (several when the query compares or splits). */
@Component({
  selector: 'dash-trend-widget',
  imports: [Chart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trend-widget.html',
  styleUrl: './trend-widget.scss',
})
export class TrendWidget {
  readonly view = input.required<WidgetView>();

  protected readonly spec = computed<ChartSpec | null>(() => {
    const r = this.view().result;
    return r?.kind === 'series' ? { kind: 'line', buckets: r.buckets, series: r.series } : null;
  });
}
