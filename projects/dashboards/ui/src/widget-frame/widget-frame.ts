import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, resource } from '@angular/core';
import { DashboardFilters, GridPosition, WIDGET_DATA, Widget, WidgetResult, WidgetView, applyFilters, isEmpty, settle } from '@integralways/dashboards';
import { DashI18n } from '../i18n/dash-i18n';
import { WidgetRegistry } from '../widgets/widget-registry';

/**
 * One widget on the grid: its title, its result from the project's data source (with the dashboard's filters), and
 * every state a reader can meet: loading, failed with a retry, no access, nothing in this period. The widget type's
 * component only ever draws a real result.
 */
@Component({
  selector: 'dash-widget-frame',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-frame.html',
  styleUrl: './widget-frame.scss',
  host: {
    '[attr.tabindex]': 'editing() ? 0 : null',
    '[attr.aria-description]': "editing() ? i18n.t('widget.arrange') : null",
    '[class.is-editing]': 'editing()',
    '(keydown)': 'key($event)',
  },
})
export class WidgetFrame {
  readonly widget = input.required<Widget>();
  readonly filters = input.required<DashboardFilters>();
  /** The board is in edit mode: show the widget's controls, and let the keyboard move and resize it. */
  readonly editing = input(false);

  readonly edit = output<void>();
  readonly duplicate = output<void>();
  readonly remove = output<void>();
  /** A keyboard step: move by x/y, or resize by w/h, in grid cells. */
  readonly nudge = output<Partial<GridPosition>>();

  protected readonly i18n = inject(DashI18n);
  private readonly data = inject(WIDGET_DATA);
  private readonly registry = inject(WidgetRegistry);

  protected readonly type = computed(() => this.registry.get(this.widget().type));
  /** The widget's own period in words, when it keeps one: the filter bar's period does not reach it. */
  protected readonly ownPeriod = computed(() => {
    const period = this.widget().query?.period;
    return period ? this.i18n.period(period) : null;
  });

  /**
   * What to ask the data source. Compared by content, so a change that does not touch the query (a new title while
   * building, a move on the grid) does not ask again.
   */
  private readonly request = computed(() => {
    const widget = this.widget();
    const type = this.type();
    if (!type?.needsData || !widget.query) {
      return undefined;
    }
    return { query: applyFilters(widget.query, this.filters()), compare: this.filters().compare, language: this.i18n.language() };
  }, { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) });

  protected readonly result = resource({
    params: () => this.request(),
    loader: ({ params }) => settle<WidgetResult>(this.data.run(params.query, { compare: params.compare, language: params.language })),
  });

  /** What the frame shows: the widget, or one of its states. */
  protected readonly state = computed(() => {
    const type = this.type();
    if (!type) {
      return 'unknown';
    }
    if (!type.needsData) {
      return 'ready';
    }
    if (this.result.error()) {
      return 'failed';
    }
    const value = this.result.hasValue() ? this.result.value() : undefined;
    if (this.result.isLoading() || !value) {
      return 'loading';
    }
    if (value.kind === 'noAccess') {
      return 'noAccess';
    }
    return isEmpty(value) ? 'empty' : 'ready';
  });

  protected readonly view = computed<WidgetView>(() => ({
    title: this.widget().title,
    settings: this.widget().settings,
    result: this.result.hasValue() ? (this.result.value() ?? null) : null,
    language: this.i18n.language(),
  }));

  /** Arrow keys move the widget, Shift and arrow keys resize it; start and end follow the reading direction. */
  protected key(event: KeyboardEvent): void {
    if (!this.editing() || event.target !== event.currentTarget) {
      return;
    }
    const ahead = this.i18n.dir() === 'rtl' ? -1 : 1;
    const steps: Record<string, Partial<GridPosition>> = event.shiftKey
      ? { ArrowRight: { w: ahead }, ArrowLeft: { w: -ahead }, ArrowDown: { h: 1 }, ArrowUp: { h: -1 } }
      : { ArrowRight: { x: ahead }, ArrowLeft: { x: -ahead }, ArrowDown: { y: 1 }, ArrowUp: { y: -1 } };
    const step = steps[event.key];
    if (step) {
      event.preventDefault();
      this.nudge.emit(step);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.edit.emit();
    }
  }
}
