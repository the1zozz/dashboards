import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output, resource } from '@angular/core';
import {
  Condition,
  DashboardFilters,
  Field,
  FIELD_CATALOG,
  Measurable,
  Measure,
  Period,
  QueryDocument,
  settle,
  Widget,
  WidgetType,
} from '@integralways/dashboards';
import { DashI18n } from '../i18n/dash-i18n';
import { Select, SelectOption } from '../controls/select/select';
import { WidgetFrame } from '../widget-frame/widget-frame';

/** What the builder edits: a widget before it has an id and a place. */
export type WidgetDraft = Omit<Widget, 'id' | 'position'>;

/** How a widget type splits its measure. */
type Split = 'none' | 'time' | 'field';

const SPLIT: Record<string, Split> = { number: 'none', trend: 'time', breakdown: 'field', table: 'field' };
const AGGREGATES: Measure['aggregate'][] = ['count', 'unique', 'sum', 'average'];
const INTERVALS: NonNullable<QueryDocument['interval']>[] = ['hour', 'day', 'week', 'month'];
const UNITS = ['hour', 'day', 'week', 'month'] as const;
const OPS: Condition['op'][] = ['eq', 'neq', 'contains', 'gt', 'lt'];

/**
 * Builds one widget: its title, what it measures, how it is split, the conditions it keeps, its own period, and the
 * type's display settings, with a live preview through the project's data source and the dashboard's filters. Field
 * names come from the project's catalog. Emits the finished widget, or nothing on cancel.
 */
@Component({
  selector: 'dash-widget-builder',
  imports: [Select, WidgetFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-builder.html',
  styleUrl: './widget-builder.scss',
})
export class WidgetBuilder {
  readonly type = input.required<WidgetType>();
  /** The widget being edited; null for a new one. */
  readonly initial = input<WidgetDraft | null>(null);
  readonly filters = input.required<DashboardFilters>();
  /** Shows "Other widget types" (a new widget, chosen from the drawer). */
  readonly canGoBack = input(false);

  readonly done = output<WidgetDraft>();
  readonly cancelled = output<void>();
  readonly back = output<void>();

  protected readonly i18n = inject(DashI18n);
  private readonly catalog = inject(FIELD_CATALOG);

  /** The catalog, asked again when the language changes (its labels are in the reader's language). */
  protected readonly fields = resource({
    params: () => this.i18n.language(),
    loader: async () => ({
      measurables: await settle<Measurable[]>(this.catalog.measurables()),
      common: await settle<Field[]>(this.catalog.commonFields()),
    }),
  });

  /** The widget being built; starts from the one being edited, or empty for the type. */
  protected readonly draft = linkedSignal<WidgetDraft>(() => this.initial() ? structuredClone(this.initial()!) : this.empty());
  /** Set once the user tries to finish: from then on, missing choices are marked. */
  protected readonly tried = linkedSignal(() => { this.type(); return false; });

  protected readonly split = computed(() => SPLIT[this.type().type] ?? 'none');
  protected readonly isNote = computed(() => !this.type().needsData);
  protected readonly query = computed(() => this.draft().query);

  protected readonly measurableOptions = computed<SelectOption[]>(() =>
    (this.fields.hasValue() ? this.fields.value().measurables : []).map((m) => ({ value: m.name, label: m.label })));
  /** Fields of the chosen measurable and those every measurable has. */
  private readonly allFields = computed<Field[]>(() => {
    if (!this.fields.hasValue()) {
      return [];
    }
    const { measurables, common } = this.fields.value();
    const own = measurables.find((m) => m.name === this.query()?.measure.of)?.fields ?? [];
    return [...own, ...common];
  });
  protected readonly fieldOptions = computed<SelectOption[]>(() => this.allFields().map((f) => ({ value: f.name, label: f.label })));
  protected readonly measureFieldOptions = computed<SelectOption[]>(() => {
    const numbers = this.query()?.measure.aggregate === 'sum' || this.query()?.measure.aggregate === 'average';
    return this.allFields().filter((f) => !numbers || f.type === 'number').map((f) => ({ value: f.name, label: f.label }));
  });
  protected readonly aggregateOptions = computed<SelectOption[]>(() => AGGREGATES.map((a) => ({ value: a, label: this.i18n.t('aggregate.' + a) })));
  protected readonly intervalOptions = computed<SelectOption[]>(() => INTERVALS.map((i) => ({ value: i, label: this.i18n.t('interval.' + i) })));
  protected readonly unitOptions = computed<SelectOption[]>(() => UNITS.map((u) => ({ value: u, label: this.i18n.t('unit.' + u) })));
  protected readonly opOptions = computed<SelectOption[]>(() => OPS.map((o) => ({ value: o, label: this.i18n.t('op.' + o) })));
  protected readonly needsField = computed(() => this.query()?.measure.aggregate !== 'count');

  /** What is still missing, as message keys; empty when the widget can be finished. */
  protected readonly problems = computed(() => {
    const q = this.query();
    if (this.isNote() || !q) {
      return [];
    }
    const problems: string[] = [];
    if (!q.measure.of) problems.push('builder.problem.of');
    if (this.needsField() && !q.measure.field) problems.push('builder.problem.field');
    if (this.split() === 'field' && !q.by) problems.push('builder.problem.by');
    if (this.split() === 'time' && !q.interval) problems.push('builder.problem.interval');
    if (q.where.some((c) => !c.field || c.value === '' || c.value === null)) problems.push('builder.problem.value');
    return problems;
  });

  /** The widget as the preview shows it: only once there is something to ask the data source. */
  protected readonly preview = computed<Widget | null>(() => {
    if (!this.isNote() && this.problems().length > 0) {
      return null;
    }
    const d = this.draft();
    return { ...d, id: 'preview', position: { x: 0, y: 0, w: 1, h: 1 } };
  });

  protected readonly settingText = (name: string) => {
    const v = this.draft().settings[name];
    return typeof v === 'string' ? v : '';
  };

  // ------------------------------------------------------------------ changes

  protected setTitle(title: string): void {
    this.draft.update((d) => ({ ...d, title }));
  }

  protected setSetting(name: string, value: unknown): void {
    this.draft.update((d) => ({ ...d, settings: { ...d.settings, [name]: value } }));
  }

  protected setMeasure(change: Partial<Measure>): void {
    this.updateQuery((q) => {
      const measure = { ...q.measure, ...change };
      // A field chosen for another measurable or aggregate may not fit any more: start again.
      if (change.of !== undefined || change.aggregate !== undefined) {
        delete measure.field;
      }
      if (measure.aggregate === 'count') {
        delete measure.field;
      }
      return { ...q, measure };
    });
  }

  protected setQuery(change: Partial<QueryDocument>): void {
    this.updateQuery((q) => ({ ...q, ...change }));
  }

  protected setLimit(text: string): void {
    const n = Number.parseInt(text, 10);
    this.updateQuery((q) => ({ ...q, limit: Number.isFinite(n) && n > 0 ? Math.min(n, 100) : undefined }));
  }

  protected addCondition(): void {
    this.updateQuery((q) => ({ ...q, where: [...q.where, { field: '', op: 'eq', value: '' }] }));
  }

  protected setCondition(index: number, change: Partial<Condition>): void {
    this.updateQuery((q) => ({ ...q, where: q.where.map((c, i) => (i === index ? { ...c, ...change } : c)) }));
  }

  /** A condition's value: a number for number fields, else the text. */
  protected setConditionValue(index: number, text: string): void {
    const field = this.allFields().find((f) => f.name === this.query()!.where[index].field);
    const n = Number(text);
    this.setCondition(index, { value: field?.type === 'number' && text.trim() !== '' && Number.isFinite(n) ? n : text });
  }

  protected removeCondition(index: number): void {
    this.updateQuery((q) => ({ ...q, where: q.where.filter((_, i) => i !== index) }));
  }

  protected valuesOf(field: string): SelectOption[] | null {
    const values = this.allFields().find((f) => f.name === field)?.values;
    return values ? values.map((v) => ({ value: v, label: v })) : null;
  }

  protected setOwnPeriod(own: boolean): void {
    this.updateQuery((q) => {
      const next = { ...q };
      if (own) {
        next.period = { last: 30, unit: 'day' };
      } else {
        delete next.period;
      }
      return next;
    });
  }

  protected setPeriod(change: Partial<{ last: number; unit: (typeof UNITS)[number] }>): void {
    this.updateQuery((q) => {
      const current = q.period && 'last' in q.period ? q.period : { last: 30, unit: 'day' as const };
      const period: Period = { ...current, ...change };
      return { ...q, period: { ...period, last: Math.max(1, Math.min(365, Math.round((period as { last: number }).last) || 1)) } as Period };
    });
  }

  protected periodLast(): number {
    const p = this.query()?.period;
    return p && 'last' in p ? p.last : 30;
  }

  protected periodUnit(): string {
    const p = this.query()?.period;
    return p && 'last' in p ? p.unit : 'day';
  }

  protected finish(): void {
    this.tried.set(true);
    if (this.problems().length === 0) {
      const d = this.draft();
      this.done.emit({ ...d, title: d.title.trim() || this.i18n.t(this.type().label) });
    }
  }

  private updateQuery(change: (q: QueryDocument) => QueryDocument): void {
    this.draft.update((d) => (d.query ? { ...d, query: change(d.query) } : d));
  }

  private empty(): WidgetDraft {
    const type = this.type();
    if (!type.needsData) {
      return { type: type.type, title: '', settings: { text: '' } };
    }
    const split = SPLIT[type.type] ?? 'none';
    const query: QueryDocument = { measure: { aggregate: 'count', of: '' }, where: [] };
    if (split === 'time') query.interval = 'day';
    if (split === 'field') query.limit = 10;
    return { type: type.type, title: '', settings: {}, query };
  }
}
