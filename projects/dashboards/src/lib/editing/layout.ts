import { Dashboard, GridPosition, Widget } from '../contract/model';

/** Columns of the grid: positions are in these. */
export const COLUMNS = 12;

/** Whether two places on the grid share at least one cell. */
export function overlaps(a: GridPosition, b: GridPosition): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Whether {@link place} is inside the grid and free of every widget but {@link ignore}. */
export function fits(widgets: Widget[], place: GridPosition, ignore?: string): boolean {
  return place.x >= 0 && place.y >= 0 && place.w >= 1 && place.h >= 1 && place.x + place.w <= COLUMNS
    && widgets.every((w) => w.id === ignore || !overlaps(w.position, place));
}

/** The first free place of this size, row by row from the top, start to end: where a new widget goes. */
export function freeSpot(widgets: Widget[], size: Pick<GridPosition, 'w' | 'h'>): GridPosition {
  const w = Math.min(size.w, COLUMNS);
  const bottom = Math.max(0, ...widgets.map((x) => x.position.y + x.position.h));
  for (let y = 0; y <= bottom; y++) {
    for (let x = 0; x + w <= COLUMNS; x++) {
      const place = { x, y, w, h: size.h };
      if (fits(widgets, place)) {
        return place;
      }
    }
  }
  return { x: 0, y: bottom, w, h: size.h };
}

/** A new widget id, unique in the dashboard. */
export function newWidgetId(dashboard: Dashboard): string {
  const taken = new Set(dashboard.widgets.map((w) => w.id));
  let id: string;
  do {
    id = 'w' + Math.random().toString(36).slice(2, 10);
  } while (taken.has(id));
  return id;
}

// ------------------------------------------------------------------ changes (each returns a new dashboard)

export function addWidget(dashboard: Dashboard, widget: Omit<Widget, 'id' | 'position'>, size: Pick<GridPosition, 'w' | 'h'>): Dashboard {
  const added: Widget = { ...widget, id: newWidgetId(dashboard), position: freeSpot(dashboard.widgets, size) };
  return { ...dashboard, widgets: [...dashboard.widgets, added] };
}

export function updateWidget(dashboard: Dashboard, id: string, change: Partial<Omit<Widget, 'id'>>): Dashboard {
  return { ...dashboard, widgets: dashboard.widgets.map((w) => (w.id === id ? { ...w, ...change } : w)) };
}

export function removeWidget(dashboard: Dashboard, id: string): Dashboard {
  return { ...dashboard, widgets: dashboard.widgets.filter((w) => w.id !== id) };
}

/** A copy right after the original when there is room, else the first free place. */
export function duplicateWidget(dashboard: Dashboard, id: string, copyTitle: (title: string) => string): Dashboard {
  const source = dashboard.widgets.find((w) => w.id === id);
  if (!source) {
    return dashboard;
  }
  const beside = { ...source.position, x: source.position.x + source.position.w };
  const place = fits(dashboard.widgets, beside) ? beside : freeSpot(dashboard.widgets, source.position);
  const copy: Widget = { ...structuredClone(source), id: newWidgetId(dashboard), title: copyTitle(source.title), position: place };
  return { ...dashboard, widgets: [...dashboard.widgets, copy] };
}

/**
 * Moves or resizes one widget by a step (the keyboard's way to edit the layout). Widgets in the way are pushed down,
 * as a drag pushes them. Returns null when the new place is outside the grid or smaller than the widget's minimum:
 * nothing moves, and the caller says why.
 */
export function nudge(dashboard: Dashboard, id: string, step: Partial<GridPosition>, min: Pick<GridPosition, 'w' | 'h'> = { w: 1, h: 1 }): Dashboard | null {
  const widget = dashboard.widgets.find((w) => w.id === id);
  if (!widget) {
    return null;
  }
  const p = widget.position;
  const place = { x: p.x + (step.x ?? 0), y: p.y + (step.y ?? 0), w: p.w + (step.w ?? 0), h: p.h + (step.h ?? 0) };
  if (place.w < min.w || place.h < min.h || place.x < 0 || place.y < 0 || place.x + place.w > COLUMNS) {
    return null;
  }
  return { ...dashboard, widgets: pushDown(dashboard.widgets.map((w) => (w.id === id ? { ...w, position: place } : w)), id) };
}

/** Moves every widget that overlaps {@link fixed} (or a widget pushed before it) down until nothing overlaps. */
function pushDown(widgets: Widget[], fixed: string): Widget[] {
  const placed = widgets.filter((w) => w.id === fixed);
  const rest = widgets.filter((w) => w.id !== fixed).sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  for (const w of rest) {
    let position = w.position;
    let blocker: Widget | undefined;
    while ((blocker = placed.find((o) => overlaps(o.position, position)))) {
      position = { ...position, y: blocker.position.y + blocker.position.h };
    }
    placed.push(position === w.position ? w : { ...w, position });
  }
  const order = new Map(widgets.map((w, i) => [w.id, i]));
  return placed.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

/** The positions the grid reports after a drag or a resize, written back into the dashboard. */
export function applyPositions(dashboard: Dashboard, positions: Map<string, GridPosition>): Dashboard {
  return { ...dashboard, widgets: dashboard.widgets.map((w) => (positions.has(w.id) ? { ...w, position: { ...positions.get(w.id)! } } : w)) };
}

/** Whether two dashboards differ in anything a save would keep. */
export function changed(a: Dashboard, b: Dashboard): boolean {
  return JSON.stringify(strip(a)) !== JSON.stringify(strip(b));
}

function strip(d: Dashboard) {
  const { updatedAt: _u, version: _v, ...rest } = d;
  return rest;
}
