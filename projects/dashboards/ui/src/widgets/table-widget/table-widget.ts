import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DashI18n, WidgetView } from '@integralways/dashboards';

interface Table {
  columns: string[];
  rows: (string | number | null)[][];
  /** Per column: holds numbers (its header and cells align to the end). */
  numeric: boolean[];
}

/** Rows and columns. A series result is shown as a table too: one row per bucket, one column per series. */
@Component({
  selector: 'dash-table-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-widget.html',
  styleUrl: './table-widget.scss',
})
export class TableWidget {
  readonly view = input.required<WidgetView>();
  protected readonly i18n = inject(DashI18n);

  protected readonly table = computed<Table | null>(() => {
    const r = this.view().result;
    let columns: string[];
    let rows: (string | number | null)[][];
    if (r?.kind === 'table') {
      ({ columns, rows } = r);
    } else if (r?.kind === 'series') {
      columns = ['', ...r.series.map((s) => s.name)];
      rows = r.buckets.map((bucket, i) => [bucket, ...r.series.map((s) => s.values[i])]);
    } else {
      return null;
    }
    const numeric = columns.map((_, c) => rows.length > 0 && rows.every((row) => row[c] === null || typeof row[c] === 'number'));
    return { columns, rows, numeric };
  });

  protected isNumber(value: unknown): value is number {
    return typeof value === 'number';
  }
}
