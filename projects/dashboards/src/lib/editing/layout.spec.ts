import { describe, expect, it } from 'vitest';
import { Dashboard, Widget } from '../contract/model';
import { addWidget, applyPositions, changed, duplicateWidget, fits, freeSpot, nudge, overlaps, removeWidget } from './layout';

const widget = (id: string, x: number, y: number, w: number, h: number): Widget =>
  ({ id, type: 'number', title: id, settings: {}, position: { x, y, w, h } });

const board = (...widgets: Widget[]): Dashboard => ({
  id: 'd', name: 'D', visibility: 'private', updatedAt: '2026-11-24T00:00:00Z', version: 3,
  filters: { period: { last: 7, unit: 'day' }, compare: 'none', where: [] }, widgets,
});

describe('layout', () => {
  it('knows when two places share a cell', () => {
    expect(overlaps({ x: 0, y: 0, w: 3, h: 2 }, { x: 2, y: 1, w: 3, h: 2 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 3, h: 2 }, { x: 3, y: 0, w: 3, h: 2 })).toBe(false);
  });

  it('puts a new widget in the first free place, else below everything', () => {
    const d = board(widget('a', 0, 0, 6, 2), widget('b', 6, 0, 3, 2));
    expect(freeSpot(d.widgets, { w: 3, h: 2 })).toEqual({ x: 9, y: 0, w: 3, h: 2 });
    expect(freeSpot(d.widgets, { w: 4, h: 2 })).toEqual({ x: 0, y: 2, w: 4, h: 2 });
    expect(freeSpot([], { w: 20, h: 1 })).toEqual({ x: 0, y: 0, w: 12, h: 1 });
  });

  it('adds, duplicates beside the original, and removes, leaving the input untouched', () => {
    const d = board(widget('a', 0, 0, 3, 2));
    const added = addWidget(d, { type: 'note', title: 'N', settings: {} }, { w: 4, h: 2 });
    expect(added.widgets[1].position).toEqual({ x: 3, y: 0, w: 4, h: 2 });
    const copied = duplicateWidget(d, 'a', (t) => t + ' (copy)');
    expect(copied.widgets[1]).toMatchObject({ title: 'a (copy)', position: { x: 3, y: 0, w: 3, h: 2 } });
    expect(copied.widgets[1].id).not.toBe('a');
    expect(removeWidget(added, 'a').widgets.map((w) => w.type)).toEqual(['note']);
    expect(d.widgets).toHaveLength(1);
  });

  it('nudges inside the grid and above the minimum size, pushing widgets in the way down', () => {
    const d = board(widget('a', 0, 0, 3, 2), widget('b', 3, 0, 3, 2), widget('c', 3, 2, 3, 2));
    expect(nudge(d, 'a', { x: -1 })).toBeNull();
    expect(nudge(d, 'b', { w: 7 })).toBeNull();
    expect(nudge(d, 'a', { h: -1 }, { w: 2, h: 2 })).toBeNull();
    expect(nudge(d, 'a', { y: 1 })!.widgets[0].position).toEqual({ x: 0, y: 1, w: 3, h: 2 });
    // a moves into b's place: b goes below a, and c below b.
    const pushed = nudge(d, 'a', { x: 1 })!;
    expect(pushed.widgets.map((w) => [w.id, w.position.y])).toEqual([['a', 0], ['b', 2], ['c', 4]]);
    expect(pushed.widgets.map((w) => w.id)).toEqual(['a', 'b', 'c']);
    expect(fits(d.widgets, { x: 6, y: 0, w: 6, h: 2 })).toBe(true);
  });

  it('writes the grid positions back, and tells a real change from a new version', () => {
    const d = board(widget('a', 0, 0, 3, 2));
    const moved = applyPositions(d, new Map([['a', { x: 4, y: 1, w: 3, h: 2 }]]));
    expect(moved.widgets[0].position).toEqual({ x: 4, y: 1, w: 3, h: 2 });
    expect(changed(d, moved)).toBe(true);
    expect(changed(d, { ...d, version: 9, updatedAt: 'later' })).toBe(false);
  });
});
