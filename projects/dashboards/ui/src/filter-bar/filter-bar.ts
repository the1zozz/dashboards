import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, resource, signal, viewChild } from '@angular/core';
import {
  Condition,
  DashboardFilters,
  datesPeriod,
  Field,
  FIELD_CATALOG,
  Period,
  PERIOD_PRESETS,
  periodDays,
  samePeriod,
  settle,
} from '@integralways/dashboards';
import { Select, SelectOption } from '../controls/select/select';
import { DashI18n } from '../i18n/dash-i18n';

/** The value of the "custom dates" choice in the period list. */
const CUSTOM = 'custom';
/** Which conditions each kind of field offers. */
const OPS: Record<Field['type'], Condition['op'][]> = {
  text: ['eq', 'neq', 'contains'],
  number: ['eq', 'neq', 'gt', 'lt'],
  date: ['gt', 'lt'],
  boolean: ['eq'],
};

/** The condition being written in the panel: a new one (index null) or one already in the bar. */
interface Draft {
  index: number | null;
  field: string | null;
  op: Condition['op'];
  value: string;
}

/**
 * The dashboard's filter bar: its period (a preset or fixed dates), the comparison with the period before, and
 * conditions on the fields every measurable has, which every widget gets on top of its own. It only says what changed
 * ({@link filtersChange}); the board decides whether that is saved (edit mode) or just what this reader sees.
 */
@Component({
  selector: 'dash-filter-bar',
  imports: [Select, CdkOverlayOrigin, CdkConnectedOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
})
export class FilterBar {
  readonly filters = input.required<DashboardFilters>();
  /** The reader's filters differ from the saved ones: offer to go back to them. */
  readonly changed = input(false);
  /** The board is being edited: the bar edits the filters saved with the dashboard. */
  readonly editing = input(false);

  readonly filtersChange = output<DashboardFilters>();
  readonly reset = output<void>();

  protected readonly i18n = inject(DashI18n);
  private readonly catalog = inject(FIELD_CATALOG);
  private readonly addButton = viewChild<ElementRef<HTMLButtonElement>>('add');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** The fields every measurable has: only those can filter every widget. Reloaded in the reader's language. */
  protected readonly fields = resource({
    params: () => this.i18n.language(),
    loader: () => settle<Field[]>(this.catalog.commonFields()),
  });
  protected readonly fieldList = computed(() => (this.fields.hasValue() ? (this.fields.value() ?? []) : []));

  /** Fixed dates are being chosen: shown when the period is fixed, or the reader just picked "custom dates". */
  private readonly pickingDates = signal(false);
  protected readonly custom = computed(() => this.pickingDates() || 'from' in this.filters().period);
  protected readonly days = computed(() => periodDays(this.filters().period));
  protected readonly datesInvalid = signal(false);

  protected readonly periodOptions = computed<SelectOption[]>(() => {
    const current = this.filters().period;
    const presets = [...PERIOD_PRESETS];
    // A saved rolling period that is not a preset (the last 14 days) is still offered, in its place by length.
    if ('last' in current && !presets.some((p) => samePeriod(p, current))) {
      presets.push(current);
      presets.sort((a, b) => length(a) - length(b));
    }
    return [
      ...presets.map((p) => ({ value: periodKey(p), label: this.i18n.period(p) })),
      { value: CUSTOM, label: this.i18n.t('filters.custom') },
    ];
  });
  protected readonly periodValue = computed(() => (this.custom() ? CUSTOM : periodKey(this.filters().period)));

  protected readonly chips = computed(() => this.filters().where.map((c) => this.i18n.condition(c, this.fieldList())));

  // ------------------------------------------------------------------ the condition panel

  protected readonly draft = signal<Draft | null>(null);
  protected readonly draftInvalid = signal(false);
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];
  /** Where the panel opens: under the chip being changed, or under "Add filter". */
  protected readonly anchor = signal<CdkOverlayOrigin | null>(null);

  protected readonly fieldOptions = computed<SelectOption[]>(() => this.fieldList().map((f) => ({ value: f.name, label: f.label })));
  protected readonly draftField = computed(() => this.fieldList().find((f) => f.name === this.draft()?.field));
  protected readonly opOptions = computed<SelectOption[]>(() =>
    OPS[this.draftField()?.type ?? 'text'].map((o) => ({ value: o, label: this.i18n.t('op.' + o) })));
  /** The values to choose from, when the catalog knows them (or yes and no); else the value is typed. */
  protected readonly valueOptions = computed<SelectOption[] | null>(() => {
    const field = this.draftField();
    if (field?.type === 'boolean') {
      return [{ value: 'true', label: this.i18n.t('filters.yes') }, { value: 'false', label: this.i18n.t('filters.no') }];
    }
    const op = this.draft()?.op;
    return field?.values?.length && (op === 'eq' || op === 'neq') ? field.values.map((v) => ({ value: v, label: v })) : null;
  });

  // ------------------------------------------------------------------ period and comparison

  protected choosePeriod(value: string | null): void {
    if (value === CUSTOM) {
      // Start from the days the current period covers, so the reader adjusts rather than types both.
      this.pickingDates.set(true);
      const { first, last } = this.days();
      const period = datesPeriod(first, last);
      if (period) {
        this.emit({ period });
      }
      return;
    }
    const period = PERIOD_PRESETS.find((p) => periodKey(p) === value) ?? parseKey(value);
    if (period) {
      this.pickingDates.set(false);
      this.datesInvalid.set(false);
      this.emit({ period });
    }
  }

  protected setDay(which: 'first' | 'last', day: string): void {
    const days = { ...this.days(), [which]: day };
    const period = datesPeriod(days.first, days.last);
    this.datesInvalid.set(!period);
    if (period) {
      this.emit({ period });
    }
  }

  protected toggleCompare(): void {
    this.emit({ compare: this.filters().compare === 'previous' ? 'none' : 'previous' });
  }

  // ------------------------------------------------------------------ conditions

  protected openNew(origin: CdkOverlayOrigin): void {
    const first = this.fieldList()[0];
    this.anchor.set(origin);
    this.draftInvalid.set(false);
    this.draft.set({ index: null, field: first?.name ?? null, op: OPS[first?.type ?? 'text'][0], value: '' });
  }

  protected openExisting(index: number, origin: CdkOverlayOrigin): void {
    const c = this.filters().where[index];
    this.anchor.set(origin);
    this.draftInvalid.set(false);
    this.draft.set({ index, field: c.field, op: c.op, value: Array.isArray(c.value) ? c.value.join(', ') : String(c.value) });
  }

  protected setDraft(change: Partial<Draft>): void {
    this.draft.update((d) => {
      if (!d) {
        return d;
      }
      const next = { ...d, ...change };
      if (change.field !== undefined && change.field !== d.field) {
        // Another field: its own conditions, and the value starts again.
        const type = this.fieldList().find((f) => f.name === change.field)?.type ?? 'text';
        next.op = OPS[type][0];
        next.value = '';
      }
      return next;
    });
    this.draftInvalid.set(false);
  }

  protected apply(): void {
    const d = this.draft();
    if (!d) {
      return;
    }
    const text = d.value.trim();
    if (!d.field || text === '') {
      this.draftInvalid.set(true);
      return;
    }
    const n = Number(text);
    const value = this.draftField()?.type === 'number' && Number.isFinite(n) ? n : text;
    const condition: Condition = { field: d.field, op: d.op, value };
    const where = [...this.filters().where];
    if (d.index === null) {
      where.push(condition);
    } else {
      where[d.index] = condition;
    }
    this.emit({ where });
    this.closePanel();
  }

  protected removeCondition(index: number): void {
    this.emit({ where: this.filters().where.filter((_, i) => i !== index) });
    // The chip is gone: keep the keyboard in the bar.
    queueMicrotask(() => this.addButton()?.nativeElement.focus());
  }

  /** The panel opened: the keyboard goes to its first control. */
  protected focusPanel(): void {
    setTimeout(() => this.panel()?.nativeElement.querySelector<HTMLElement>('button, input')?.focus());
  }

  protected closePanel(): void {
    this.draft.set(null);
    this.anchor()?.elementRef.nativeElement.focus();
    this.anchor.set(null);
  }

  protected resetAll(): void {
    this.pickingDates.set(false);
    this.datesInvalid.set(false);
    this.reset.emit();
  }

  private emit(change: Partial<DashboardFilters>): void {
    this.filtersChange.emit({ ...this.filters(), ...change });
  }
}

function periodKey(period: Period): string {
  return 'last' in period ? `last:${period.last}:${period.unit}` : CUSTOM;
}

function parseKey(key: string | null): Period | null {
  const m = /^last:(\d+):(hour|day|week|month)$/.exec(key ?? '');
  return m ? { last: Number(m[1]), unit: m[2] as 'hour' | 'day' | 'week' | 'month' } : null;
}

/** Rough length in hours, to order the period list. */
function length(period: Period): number {
  return 'last' in period ? period.last * { hour: 1, day: 24, week: 168, month: 720 }[period.unit] : Infinity;
}
