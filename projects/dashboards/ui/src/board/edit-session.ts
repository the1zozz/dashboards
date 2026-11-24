import { computed, inject, Injectable, signal } from '@angular/core';
import { changed, Dashboard, DASHBOARD_STORE, settle } from '@integralways/dashboards';

/** How many steps Undo keeps. */
const HISTORY = 50;

/** Why the last save did not happen. */
export type SaveProblem = 'conflict' | 'failed' | null;

/**
 * One board's editing: a working copy of the dashboard, every change a step that Undo takes back, and a save through
 * the project's store. Nothing reaches the store before Save; Cancel drops the copy. A save the store refuses because
 * someone else saved first keeps the copy and says so, and the editor can reload theirs.
 */
@Injectable()
export class EditSession {
  private readonly store = inject(DASHBOARD_STORE);

  /** The dashboard as last loaded or saved. */
  private readonly saved = signal<Dashboard | null>(null);
  private readonly history = signal<Dashboard[]>([]);

  readonly draft = signal<Dashboard | null>(null);
  readonly editing = computed(() => this.draft() !== null);
  readonly canUndo = computed(() => this.history().length > 0);
  readonly dirty = computed(() => {
    const draft = this.draft();
    const saved = this.saved();
    return !!draft && !!saved && changed(draft, saved);
  });
  readonly saving = signal(false);
  readonly problem = signal<SaveProblem>(null);

  /** Starts editing {@link dashboard}: the working copy begins as it is. */
  start(dashboard: Dashboard): void {
    this.saved.set(dashboard);
    this.draft.set(structuredClone(dashboard));
    this.history.set([]);
    this.problem.set(null);
  }

  /**
   * Applies one change to the working copy as one Undo step. A change that returns null (refused, e.g. no room) or
   * the same dashboard changes nothing. Returns whether something changed.
   */
  apply(change: (draft: Dashboard) => Dashboard | null): boolean {
    const current = this.draft();
    if (!current) {
      return false;
    }
    const next = change(current);
    if (!next || !changed(next, current)) {
      return false;
    }
    this.history.update((h) => [...h.slice(-(HISTORY - 1)), current]);
    this.draft.set(next);
    return true;
  }

  undo(): void {
    const h = this.history();
    if (h.length === 0) {
      return;
    }
    this.draft.set(h[h.length - 1]);
    this.history.set(h.slice(0, -1));
  }

  cancel(): void {
    this.draft.set(null);
    this.history.set([]);
    this.problem.set(null);
  }

  /** Saves the working copy; returns the saved dashboard, or null when the store refused or failed. */
  async save(): Promise<Dashboard | null> {
    const draft = this.draft();
    if (!draft || this.saving()) {
      return null;
    }
    this.saving.set(true);
    this.problem.set(null);
    try {
      // The store sees the version the editor started from: a newer save by someone else makes it refuse.
      const saved = await settle(this.store.save({ ...draft, version: this.saved()!.version }));
      this.cancel();
      this.saved.set(saved);
      return saved;
    } catch (e) {
      this.problem.set(isConflict(e) ? 'conflict' : 'failed');
      return null;
    } finally {
      this.saving.set(false);
    }
  }
}

/**
 * Whether the store refused because the dashboard changed meanwhile: an HTTP 409, or an error the store marks with
 * {@code conflict: true} (see CONTRACT.md, the store).
 */
function isConflict(error: unknown): boolean {
  const e = error as { status?: number; conflict?: boolean } | null;
  return !!e && (e.status === 409 || e.conflict === true);
}
