import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, resource, signal } from '@angular/core';
import { Dashboard, DASHBOARD_STORE, DashboardSummary, settle, Visibility } from '@integralways/dashboards';
import { DashboardActions } from '../actions/dashboard-actions';
import { DashI18n } from '../i18n/dash-i18n';
import { DashboardCard } from '../dashboard-card/dashboard-card';

/** A dashboard to show: {@link edit} when it was just made and opens ready to add widgets. */
export interface DashboardOpen {
  id: string;
  edit: boolean;
}

type Scope = 'all' | Visibility;

/**
 * The dashboards the reader can see, as cards: search, shared or private, and for each what the reader may do (open,
 * edit, copy, share, delete). Those who may create make a new one here. The package does not route: the page passes
 * {@link link} (a real link, so a dashboard opens in a new tab too) and goes where {@link open} says.
 * Usage: {@code <dash-dashboard-list [link]="href" (open)="go($event)" />}.
 */
@Component({
  selector: 'dash-dashboard-list',
  imports: [DashboardCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-list.html',
  styleUrl: './dashboard-list.scss',
  host: { '[attr.dir]': 'i18n.dir()' },
})
export class DashboardList {
  /** The address of a dashboard's page, for its link; without it the cards are buttons. */
  readonly link = input<((id: string) => string) | null>(null);
  /** Show the "New dashboard" button (to those who may create); a page may put its own in its header instead. */
  readonly createButton = input(true);
  readonly open = output<DashboardOpen>();

  protected readonly i18n = inject(DashI18n);
  protected readonly actions = inject(DashboardActions);
  private readonly store = inject(DASHBOARD_STORE);
  private readonly announcer = inject(LiveAnnouncer);

  protected readonly dashboards = resource({
    params: () => this.i18n.language(),
    loader: () => settle<DashboardSummary[]>(this.store.list()),
  });
  protected readonly query = signal('');
  protected readonly scope = signal<Scope>('all');
  protected readonly scopes: Scope[] = ['all', 'workspace', 'private'];

  /** Built-in first, then the most recently changed. */
  private readonly sorted = computed(() => {
    const list = this.dashboards.hasValue() ? (this.dashboards.value() ?? []) : [];
    return [...list].sort((a, b) => Number(!!b.builtIn) - Number(!!a.builtIn) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  });
  protected readonly counts = computed(() => {
    const list = this.sorted();
    return { all: list.length, workspace: list.filter((d) => d.visibility === 'workspace').length, private: list.filter((d) => d.visibility === 'private').length };
  });
  protected readonly shown = computed(() => {
    const words = this.query().trim().toLocaleLowerCase(this.i18n.language()).split(/\s+/).filter(Boolean);
    const scope = this.scope();
    return this.sorted().filter((d) => (scope === 'all' || d.visibility === scope)
      && words.every((w) => `${d.name} ${d.description ?? ''} ${d.ownerName ?? ''}`.toLocaleLowerCase(this.i18n.language()).includes(w)));
  });

  protected href(id: string): string | null {
    return this.link()?.(id) ?? null;
  }

  /** A plain click opens it here; with Ctrl, Cmd, Shift or the middle button the browser opens the link as usual. */
  protected follow(event: MouseEvent | null, id: string, edit = false): void {
    if (event && this.href(id) && (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) {
      return;
    }
    event?.preventDefault();
    this.open.emit({ id, edit });
  }

  protected async create(): Promise<void> {
    const made = await this.actions.create();
    if (made) {
      this.open.emit({ id: made.id, edit: true });
    }
  }

  protected async copy(d: DashboardSummary): Promise<void> {
    const made = await this.actions.copy(d);
    if (made) {
      this.added(made);
      this.announcer.announce(this.i18n.t('list.copied', { name: made.name }));
    }
  }

  protected async share(d: DashboardSummary): Promise<void> {
    const saved = await this.actions.share(d);
    if (saved) {
      this.replace(saved);
    }
  }

  protected async remove(d: DashboardSummary): Promise<void> {
    if (await this.actions.remove(d)) {
      this.dashboards.update((list) => list?.filter((x) => x.id !== d.id));
      this.announcer.announce(this.i18n.t('list.deleted', { name: d.name }));
    }
  }

  protected clear(): void {
    this.query.set('');
    this.scope.set('all');
  }

  /** The list changes in place: no reload, no jump, and the reader's search stays. */
  private added(made: Dashboard): void {
    this.dashboards.update((list) => [summary(made), ...(list ?? [])]);
  }

  private replace(saved: Dashboard): void {
    this.dashboards.update((list) => list?.map((x) => (x.id === saved.id ? { ...x, ...summary(saved) } : x)));
  }
}

function summary(d: Dashboard): DashboardSummary {
  const { widgets: _w, filters: _f, version: _v, ...rest } = d;
  return rest;
}
