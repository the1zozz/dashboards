import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DASHBOARD_ACCESS, DashboardAccess, DashboardSummary } from '@integralways/dashboards';
import { DashboardActions } from './dashboard-actions';

const mine: DashboardSummary = { id: 'a', name: 'A', visibility: 'private', updatedAt: '2026-11-24T00:00:00Z' };
const builtIn: DashboardSummary = { ...mine, id: 'b', builtIn: true, visibility: 'workspace' };

function actions(access: DashboardAccess): DashboardActions {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: DASHBOARD_ACCESS, useValue: access }] });
  return TestBed.inject(DashboardActions);
}

describe('DashboardActions', () => {
  const everything: DashboardAccess = { canCreate: () => true, canEdit: () => true, canShare: () => true };

  it('never edits, shares or deletes a built-in dashboard, whatever the project allows', () => {
    const a = actions(everything);
    expect([a.canEdit(builtIn), a.canShare(builtIn), a.canRemove(builtIn)]).toEqual([false, false, false]);
    expect([a.canEdit(mine), a.canShare(mine), a.canRemove(mine)]).toEqual([true, true, true]);
  });

  it('lets those who may share delete, unless the project says who may delete', () => {
    expect(actions({ ...everything, canShare: () => false }).canRemove(mine)).toBe(false);
    expect(actions({ ...everything, canShare: () => false, canRemove: () => true }).canRemove(mine)).toBe(true);
    expect(actions({ ...everything, canRemove: () => false }).canRemove(mine)).toBe(false);
  });
});
