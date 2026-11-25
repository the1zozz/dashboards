import { Injectable } from '@angular/core';
import { Dashboard, DashboardStore, DashboardSummary, Visibility } from '@integralways/dashboards';
import { WEEKLY_HEALTH } from './weekly-health';

/** What a project might ship with: everyone sees it, nobody edits it, anyone may copy it. */
const STARTER: Dashboard = {
  ...WEEKLY_HEALTH,
  id: 'starter',
  name: 'Starter',
  description: 'Comes with the app. Make a copy to change it.',
  builtIn: true,
  ownerName: undefined,
  updatedAt: '2026-11-01T09:00:00Z',
};

/** Someone's private dashboard, not started yet. */
const IDEAS: Dashboard = {
  id: 'ideas',
  name: 'Ideas',
  description: 'Private until it is ready.',
  visibility: 'private',
  ownerName: 'Demo',
  updatedAt: '2026-11-20T15:30:00Z',
  widgets: [],
  filters: { period: { last: 30, unit: 'day' }, compare: 'none', where: [] },
  version: 1,
};

/** Dashboards kept in memory for the demo: lost on reload, which is fine for a demo. */
@Injectable()
export class DemoStore implements DashboardStore {
  private readonly dashboards = new Map<string, Dashboard>([STARTER, WEEKLY_HEALTH, IDEAS].map((d) => [d.id, structuredClone(d)]));

  list(): Promise<DashboardSummary[]> {
    return Promise.resolve([...this.dashboards.values()].map(({ widgets: _w, filters: _f, version: _v, ...summary }) => summary));
  }

  get(id: string): Promise<Dashboard> {
    const found = this.dashboards.get(id);
    return found ? Promise.resolve(structuredClone(found)) : Promise.reject(new Error('No such dashboard'));
  }

  save(dashboard: Dashboard): Promise<Dashboard> {
    const current = this.dashboards.get(dashboard.id);
    if (current && current.version !== dashboard.version) {
      return Promise.reject(Object.assign(new Error('Someone else saved this dashboard'), { conflict: true }));
    }
    const saved = { ...structuredClone(dashboard), version: dashboard.version + 1, updatedAt: new Date().toISOString() };
    this.dashboards.set(saved.id, saved);
    return Promise.resolve(structuredClone(saved));
  }

  create(name: string, description?: string): Promise<Dashboard> {
    const dashboard: Dashboard = { id: crypto.randomUUID(), name, description, visibility: 'private', ownerName: 'Demo', updatedAt: new Date().toISOString(),
      widgets: [], filters: { period: { last: 7, unit: 'day' }, compare: 'previous', where: [] }, version: 0 };
    this.dashboards.set(dashboard.id, dashboard);
    return Promise.resolve(structuredClone(dashboard));
  }

  remove(id: string): Promise<void> {
    this.dashboards.delete(id);
    return Promise.resolve();
  }

  async copy(id: string, name: string): Promise<Dashboard> {
    const source = await this.get(id);
    const copy = { ...source, id: crypto.randomUUID(), name, builtIn: false, visibility: 'private' as Visibility, ownerName: 'Demo',
      updatedAt: new Date().toISOString(), version: 0 };
    this.dashboards.set(copy.id, copy);
    return structuredClone(copy);
  }

  async share(id: string, visibility: Visibility): Promise<Dashboard> {
    const source = await this.get(id);
    return this.save({ ...source, visibility });
  }
}
