import { inject, Injectable } from '@angular/core';
import { EXTRA_WIDGETS, WidgetType } from '@integralways/dashboards';
import { BreakdownWidget } from './breakdown-widget/breakdown-widget';
import { NoteWidget } from './note-widget/note-widget';
import { NumberWidget } from './number-widget/number-widget';
import { TableWidget } from './table-widget/table-widget';
import { TrendWidget } from './trend-widget/trend-widget';

/** 24×24 icon paths (stroke) for the add-widget drawer. */
const ICONS = {
  number: 'M4 17V7l4 10V7M13 7h3a2 2 0 0 1 0 4h-3m0 0h3.5a2 2 0 0 1 0 4H13V7',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  breakdown: 'M5 20V10M12 20V4M19 20v-7',
  table: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14',
  note: 'M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5',
};

/** The widget types the package draws itself. */
export const BUILT_IN_WIDGETS: WidgetType[] = [
  { type: 'number', label: 'type.number', description: 'type.number.text', icon: ICONS.number, component: NumberWidget,
    defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, needsData: true },
  { type: 'trend', label: 'type.trend', description: 'type.trend.text', icon: ICONS.trend, component: TrendWidget,
    defaultSize: { w: 6, h: 4 }, minSize: { w: 3, h: 3 }, needsData: true },
  { type: 'breakdown', label: 'type.breakdown', description: 'type.breakdown.text', icon: ICONS.breakdown,
    component: BreakdownWidget, defaultSize: { w: 4, h: 4 }, minSize: { w: 3, h: 3 }, needsData: true },
  { type: 'table', label: 'type.table', description: 'type.table.text', icon: ICONS.table, component: TableWidget,
    defaultSize: { w: 6, h: 4 }, minSize: { w: 3, h: 3 }, needsData: true },
  { type: 'note', label: 'type.note', description: 'type.note.text', icon: ICONS.note, component: NoteWidget,
    defaultSize: { w: 4, h: 2 }, minSize: { w: 2, h: 1 }, needsData: false },
];

/** The built-in widget types and the project's own; a project's type with a built-in name replaces it. */
@Injectable({ providedIn: 'root' })
export class WidgetRegistry {
  private readonly types = new Map<string, WidgetType>();

  constructor() {
    for (const t of [...BUILT_IN_WIDGETS, ...(inject(EXTRA_WIDGETS, { optional: true }) ?? [])]) {
      this.types.set(t.type, t);
    }
  }

  get(type: string): WidgetType | undefined {
    return this.types.get(type);
  }

  all(): WidgetType[] {
    return [...this.types.values()];
  }
}
