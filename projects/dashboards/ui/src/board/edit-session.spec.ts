import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Dashboard, DASHBOARD_STORE, DashboardStore, removeWidget } from '@integralways/dashboards';
import { EditSession } from './edit-session';

const dashboard = (version: number): Dashboard => ({
  id: 'd', name: 'D', visibility: 'private', updatedAt: '2026-11-24T00:00:00Z', version,
  filters: { period: { last: 7, unit: 'day' }, compare: 'none', where: [] },
  widgets: [{ id: 'a', type: 'note', title: 'A', settings: {}, position: { x: 0, y: 0, w: 3, h: 2 } },
            { id: 'b', type: 'note', title: 'B', settings: {}, position: { x: 3, y: 0, w: 3, h: 2 } }],
});

/** A store that keeps one dashboard and refuses a save from an older version, as the contract asks. */
class FakeStore implements Partial<DashboardStore> {
  current = dashboard(3);
  failNext = false;
  save(d: Dashboard): Promise<Dashboard> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error('network'));
    }
    if (d.version !== this.current.version) {
      return Promise.reject(Object.assign(new Error('changed meanwhile'), { status: 409 }));
    }
    this.current = { ...d, version: d.version + 1 };
    return Promise.resolve(this.current);
  }
}

describe('EditSession', () => {
  let session: EditSession;
  let store: FakeStore;

  beforeEach(() => {
    store = new FakeStore();
    TestBed.configureTestingModule({ providers: [EditSession, { provide: DASHBOARD_STORE, useValue: store }] });
    session = TestBed.inject(EditSession);
    session.start(dashboard(3));
  });

  it('keeps every change as a step Undo takes back, and ignores a refused change', () => {
    expect(session.dirty()).toBe(false);
    expect(session.apply((d) => removeWidget(d, 'a'))).toBe(true);
    expect(session.apply(() => null)).toBe(false);
    expect(session.apply((d) => d)).toBe(false);
    expect(session.draft()!.widgets.map((w) => w.id)).toEqual(['b']);
    expect(session.dirty()).toBe(true);
    session.undo();
    expect(session.draft()!.widgets.map((w) => w.id)).toEqual(['a', 'b']);
    expect(session.canUndo()).toBe(false);
    expect(session.dirty()).toBe(false);
  });

  it('saves from the version it started with, and ends editing', async () => {
    session.apply((d) => removeWidget(d, 'a'));
    const saved = await session.save();
    expect(saved!.version).toBe(4);
    expect(store.current.widgets).toHaveLength(1);
    expect(session.editing()).toBe(false);
  });

  it('keeps the work and says so when someone else saved first, or the save failed', async () => {
    store.current = { ...dashboard(4), name: 'Theirs' };
    session.apply((d) => removeWidget(d, 'a'));
    expect(await session.save()).toBeNull();
    expect(session.problem()).toBe('conflict');
    expect(session.editing()).toBe(true);
    expect(session.draft()!.widgets).toHaveLength(1);
    expect(store.current.name).toBe('Theirs');

    store.current = dashboard(3);
    store.failNext = true;
    expect(await session.save()).toBeNull();
    expect(session.problem()).toBe('failed');
    expect(session.draft()!.widgets).toHaveLength(1);
  });
});
