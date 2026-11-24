import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, resource } from '@angular/core';
import { DashI18n, DashboardFilters, WIDGET_DATA, Widget, WidgetResult, WidgetView, applyFilters, isEmpty, settle } from '@integralways/dashboards';
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
})
export class WidgetFrame {
  readonly widget = input.required<Widget>();
  readonly filters = input.required<DashboardFilters>();

  protected readonly i18n = inject(DashI18n);
  private readonly data = inject(WIDGET_DATA);
  private readonly registry = inject(WidgetRegistry);

  protected readonly type = computed(() => this.registry.get(this.widget().type));

  protected readonly result = resource({
    params: () => {
      const widget = this.widget();
      const type = this.type();
      if (!type?.needsData || !widget.query) {
        return undefined;
      }
      return { query: applyFilters(widget.query, this.filters()), compare: this.filters().compare, language: this.i18n.language() };
    },
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
}
