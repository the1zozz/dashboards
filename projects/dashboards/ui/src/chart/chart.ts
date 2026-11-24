import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  viewChild,
} from '@angular/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { ECharts, EChartsCoreOption, init, use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { DashI18n } from '../i18n/dash-i18n';

use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

/** What a chart shows: one or more series over the same buckets (times or field values). */
export interface ChartSpec {
  kind: 'line' | 'bar';
  buckets: string[];
  series: { name: string; values: number[] }[];
  /** Bars grow sideways, longest first (a breakdown). */
  horizontal?: boolean;
}

/**
 * An ECharts chart that follows the page: colours from the package's CSS variables (so light and dark and the
 * project's theme), right-to-left in Arabic, digits in the page's language, and its size from the widget it sits in.
 */
@Component({
  selector: 'dash-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
})
export class Chart {
  readonly spec = input.required<ChartSpec>();
  /** Spoken by screen readers in place of the canvas. */
  readonly label = input.required<string>();

  private readonly i18n = inject(DashI18n);
  private readonly zone = inject(NgZone);
  private readonly canvas = viewChild.required<ElementRef<HTMLDivElement>>('canvas');
  private chart: ECharts | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.canvas().nativeElement;
      this.chart = this.zone.runOutsideAngular(() => init(element, undefined, { renderer: 'canvas' }));
      this.draw();
      const resize = new ResizeObserver(() => this.zone.runOutsideAngular(() => this.chart?.resize()));
      resize.observe(element);
      // A theme switch changes the CSS variables, not an input: redraw when the page's theme attributes change.
      const theme = new MutationObserver(() => this.draw());
      theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'dir', 'lang'] });
      destroyRef.onDestroy(() => {
        resize.disconnect();
        theme.disconnect();
        this.chart?.dispose();
        this.chart = null;
      });
    });
    effect(() => {
      this.spec();
      this.i18n.language();
      this.draw();
    });
  }

  private draw(): void {
    if (!this.chart) {
      return;
    }
    const options = this.options(this.spec());
    this.zone.runOutsideAngular(() => this.chart?.setOption(options, { notMerge: true }));
  }

  private options(spec: ChartSpec): EChartsCoreOption {
    const style = getComputedStyle(this.canvas().nativeElement);
    const token = (name: string) => style.getPropertyValue(name).trim();
    const rtl = this.i18n.dir() === 'rtl';
    const ink = token('--dash-muted');
    const line = token('--dash-line');
    const font = { color: ink, fontFamily: token('--dash-font'), fontSize: 12 };
    const formatNumber = (v: number) => this.i18n.number(v, { notation: 'compact' });
    const categories = { type: 'category', data: spec.buckets, inverse: rtl && !spec.horizontal, axisLabel: font,
      axisLine: { lineStyle: { color: line } }, axisTick: { show: false } };
    const values = { type: 'value', axisLabel: { ...font, formatter: formatNumber }, splitLine: { lineStyle: { color: line } },
      position: rtl ? 'right' : 'left', inverse: rtl && !!spec.horizontal };
    return {
      color: [1, 2, 3, 4].map((n) => token(`--dash-chart-${n}`)),
      textStyle: font,
      animation: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      grid: { top: spec.series.length > 1 ? 32 : 12, bottom: 8, left: 8, right: 8, containLabel: true },
      legend: spec.series.length > 1 ? { top: 0, textStyle: font, icon: 'roundRect', itemWidth: 10, itemHeight: 10 } : undefined,
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => this.i18n.number(v), textStyle: { fontFamily: font.fontFamily },
        backgroundColor: token('--dash-surface'), borderColor: line },
      xAxis: spec.horizontal ? values : categories,
      yAxis: spec.horizontal ? { ...categories, inverse: true, position: rtl ? 'right' : 'left' } : values,
      series: spec.series.map((s) => spec.kind === 'line'
        ? { type: 'line', name: s.name, data: s.values, showSymbol: spec.buckets.length <= 31, symbolSize: 8,
            lineStyle: { width: 2 }, smooth: false }
        : { type: 'bar', name: s.name, data: s.values, barMaxWidth: 28,
            itemStyle: { borderRadius: spec.horizontal ? (rtl ? [4, 0, 0, 4] : [0, 4, 4, 0]) : [4, 4, 0, 0] } }),
    };
  }
}
