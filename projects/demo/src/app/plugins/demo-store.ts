import { Injectable } from '@angular/core';
import { Dashboard, DashboardStore, DashboardSummary, Visibility } from '@integralways/dashboards';
import { WEEKLY_HEALTH } from './weekly-health';

/** Dashboards kept in memory for the demo: lost on reload, which is fine for a demo. */
@Injectable()
export class DemoStore implements DashboardStore {
  private readonly dashboards = new Map<string, Dashboard>([[WEEKLY_HEALTH.id, structuredClone(WEEKLY_HEALTH)]]);

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
    const dashboard: Dashboard = { id: crypto.randomUUID(), name, description, visibility: 'private', updatedAt: new Date().toISOString(),
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
    const copy = { ...source, id: crypto.randomUUID(), name, builtIn: false, visibility: 'private' as Visibility, version: 0 };
    this.dashboards.set(copy.id, copy);
    return structuredClone(copy);
  }

  async share(id: string, visibility: Visibility): Promise<Dashboard> {
    const source = await this.get(id);
    return this.save({ ...source, visibility });
  }
}
