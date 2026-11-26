import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Dialog } from '@angular/cdk/dialog';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, linkedSignal, output, resource, signal, untracked } from '@angular/core';
import { Gridster, GridsterItem } from 'angular-gridster2';
import {
  addWidget,
  applyPositions,
  COLUMNS,
  Dashboard,
  DashboardFilters,
  DASHBOARD_STORE,
  duplicateWidget,
  GridPosition,
  nudge,
  removeWidget,
  sameFilters,
  settle,
  updateWidget,
  Widget,
} from '@integralways/dashboards';
import { DashboardActions } from '../actions/dashboard-actions';
import { FilterBar } from '../filter-bar/filter-bar';
import { DashI18n } from '../i18n/dash-i18n';
import { WidgetDraft } from '../builder/widget-builder';
import { WidgetDialog, WidgetDialogData } from '../widget-dialog/widget-dialog';
import { WidgetFrame } from '../widget-frame/widget-frame';
import { WidgetRegistry } from '../widgets/widget-registry';
import { VisibilityBadge } from '../visibility-badge/visibility-badge';
import { EditSession } from './edit-session';

/** Columns of the grid: positions in the model are in these. */
export const GRID_COLUMNS = COLUMNS;
/** Height of one grid row in pixels. */
export const ROW_HEIGHT = 80;
/** Space between widgets in pixels. */
export const GRID_GAP = 16;
/** Below this width the widgets stack in one column, in reading order. */
export const PHONE_WIDTH = 640;

/** One widget on the grid: the widget, and the cell object gridster moves (it changes x, y, cols and rows in place). */
interface Item {
  widget: Widget;
  cell: { x: number; y: number; cols: number; rows: number; minItemCols?: number; minItemRows?: number };
}

/**
 * A dashboard: loaded from the project's store and laid out on a 12-column grid, mirrored in right-to-left languages,
 * one column on a phone. Those the project allows can edit it: add, build, move, resize, duplicate and remove widgets,
 * by mouse or keyboard, with Undo, then save. Above the grid, the filter bar: a reader's changes to it are theirs alone
 * (until Reset), an editor's are saved with the dashboard. Beside the title, who can see it; in the header, Share and
 * More (copy, delete) for those allowed. The page goes where {@link copied} and {@link removed} say. Usage:
 * {@code <dash-board [id]="dashboardId" (removed)="back()" />}; the page's own actions go in the header's row as
 * content marked {@code dashActions}.
 */
@Component({
  selector: 'dash-board',
  imports: [Gridster, GridsterItem, WidgetFrame, FilterBar, VisibilityBadge, CdkMenu, CdkMenuItem, CdkMenuTrigger],
  providers: [EditSession],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board.html',
  styleUrl: './board.scss',
  host: { '[attr.dir]': 'i18n.dir()', '(document:keydown)': 'shortcut($event)' },
})
export class Board {
  readonly id = input.required<string>();
  /** Show the name, description and edit toolbar above the grid. */
  readonly header = input(true);
  /** Open in edit mode once loaded, when the reader may edit (a dashboard just created, say). */
  readonly startEditing = input(false);
  /** Show the filter bar above the grid. */
  readonly filterBar = input(true);
  /**
   * The filters to show instead of the saved ones, e.g. read from the page's address; undefined shows the saved ones.
   * Not saved: the reader's own view, as their changes in the bar are.
   */
  readonly filters = input<DashboardFilters | undefined>(undefined);
  /** The reader changed the filters (the page may keep them in its address); undefined when back to the saved ones. */
  readonly filtersChange = output<DashboardFilters | undefined>();
  /** Show Share and More (copy, delete) in the header to those allowed. */
  readonly actions = input(true);
  /** A copy was made (from More): the page usually opens it. */
  readonly copied = output<Dashboard>();
  /** It was deleted (from More): the page goes back to the list. */
  readonly removed = output<string>();

  protected readonly i18n = inject(DashI18n);
  protected readonly session = inject(EditSession);
  private readonly store = inject(DASHBOARD_STORE);
  protected readonly can = inject(DashboardActions);
  private readonly registry = inject(WidgetRegistry);
  private readonly dialog = inject(Dialog);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Loaded again in the reader's language when it changes: a project may translate a built-in dashboard's texts. */
  protected readonly dashboard = resource({
    params: () => ({ id: this.id(), language: this.i18n.language() }),
    loader: ({ params }) => settle<Dashboard>(this.store.get(params.id)),
  });

  /** The reader's own filters, when they changed the bar (or the page gave some): never saved. */
  private readonly viewFilters = linkedSignal<DashboardFilters | undefined>(() => this.filters());

  /** What the grid shows: the working copy while editing, else the saved dashboard. */
  protected readonly shown = computed<Dashboard | undefined>(() =>
    this.session.draft() ?? (this.dashboard.hasValue() ? this.dashboard.value() : undefined));
  protected readonly canEdit = computed(() => {
    const d = this.dashboard.hasValue() ? this.dashboard.value() : undefined;
    return !!d && this.can.canEdit(d);
  });
  /** The saved dashboard, for the header's Share and More. */
  protected readonly saved = computed(() => (this.dashboard.hasValue() ? this.dashboard.value() : undefined));
  /** The filters every widget gets now: the working copy's while editing, else the reader's, else the saved ones. */
  protected readonly activeFilters = computed<DashboardFilters | undefined>(() => {
    const draft = this.session.draft();
    if (draft) {
      return draft.filters;
    }
    const saved = this.shown()?.filters;
    return this.viewFilters() ?? saved;
  });
  /** The reader's filters differ from the saved ones. */
  protected readonly filtersChanged = computed(() => {
    const own = this.viewFilters();
    const saved = this.shown()?.filters;
    return !this.session.editing() && !!own && !!saved && !sameFilters(own, saved);
  });

  private startedEditing = false;
  /** Asking "discard your changes?" after Cancel with unsaved changes. */
  protected readonly confirmingCancel = signal(false);

  protected readonly options = computed(() => {
    const editing = this.session.editing();
    return {
      gridType: 'verticalFixed' as const,
      fixedRowHeight: ROW_HEIGHT,
      keepFixedHeightInMobile: true,
      minCols: GRID_COLUMNS,
      maxCols: GRID_COLUMNS,
      minRows: 1,
      margin: GRID_GAP,
      outerMargin: false,
      mobileBreakpoint: PHONE_WIDTH,
      displayGrid: editing ? ('onDrag&Resize' as const) : ('none' as const),
      compactType: 'compactUp' as const,
      pushItems: true,
      dirType: this.i18n.dir(),
      draggable: { enabled: editing, ignoreContent: true, dragHandleClass: 'dash-drag-handle' },
      resizable: { enabled: editing },
      disableScrollHorizontal: true,
      itemChangeCallback: () => this.layoutChanged(),
    };
  });

  /** The widgets in reading order (top to bottom, then start to end): the order they stack in on a phone. */
  protected readonly items = computed<Item[]>(() => {
    const d = this.shown();
    if (!d) {
      return [];
    }
    return [...d.widgets]
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
      .map((widget) => {
        const min = this.registry.get(widget.type)?.minSize;
        const p = widget.position;
        return { widget, cell: { x: p.x, y: p.y, cols: p.w, rows: p.h, minItemCols: min?.w, minItemRows: min?.h } };
      });
  });

  /**
   * The grid's height from its rows. gridster's own sizing (setGridSize) set a fixed width wider than the container,
   * which overflowed the page and, right to left, pushed widgets off screen.
   */
  protected readonly height = computed(() => {
    const rows = Math.max(0, ...this.items().map((i) => i.cell.y + i.cell.rows));
    return rows === 0 ? 0 : rows * (ROW_HEIGHT + GRID_GAP) - GRID_GAP;
  });

  constructor() {
    // Opened to edit: once, when the dashboard has loaded and the reader may edit it.
    effect(() => {
      if (this.startEditing() && this.canEdit() && !this.startedEditing) {
        this.startedEditing = true;
        untracked(() => this.edit());
      }
    });
  }

  // ------------------------------------------------------------------ the whole dashboard

  protected async share(d: Dashboard): Promise<void> {
    const saved = await this.can.share(d);
    if (saved) {
      // The store answers with the whole dashboard; keep the widgets shown if a store answers with less.
      this.dashboard.set({ ...d, ...saved, widgets: saved.widgets ?? d.widgets, filters: saved.filters ?? d.filters });
    }
  }

  protected async copy(d: Dashboard): Promise<void> {
    const made = await this.can.copy(d);
    if (made) {
      this.copied.emit(made);
    }
  }

  protected async removeDashboard(d: Dashboard): Promise<void> {
    if (await this.can.remove(d)) {
      this.removed.emit(d.id);
    }
  }

  // ------------------------------------------------------------------ editing

  /** From an empty dashboard, not yet in edit mode: edit it and choose the first widget. */
  protected startWithWidget(): void {
    this.edit();
    this.addWidget();
  }

  protected edit(): void {
    const d = this.dashboard.hasValue() ? this.dashboard.value() : undefined;
    if (d) {
      // The editor edits the saved filters: their own view would otherwise be saved without them noticing.
      this.resetFilters();
      this.session.start(d);
    }
  }

  /** A change in the filter bar: saved with the dashboard while editing, else the reader's own view. */
  protected setFilters(filters: DashboardFilters): void {
    if (this.session.editing()) {
      this.session.apply((d) => ({ ...d, filters }));
      return;
    }
    this.viewFilters.set(filters);
    this.filtersChange.emit(filters);
  }

  /** Back to the filters saved with the dashboard. */
  protected resetFilters(): void {
    if (this.viewFilters() !== undefined) {
      this.viewFilters.set(undefined);
      this.filtersChange.emit(undefined);
    }
  }

  protected cancel(): void {
    if (this.session.dirty() && !this.confirmingCancel()) {
      this.confirmingCancel.set(true);
      return;
    }
    this.confirmingCancel.set(false);
    this.session.cancel();
  }

  protected async save(): Promise<void> {
    const saved = await this.session.save();
    if (saved) {
      this.dashboard.set(saved);
      this.announcer.announce(this.i18n.t('board.saved'));
    }
  }

  /** After a conflict: drop the working copy and load the version someone else saved. */
  protected reloadTheirs(): void {
    this.session.cancel();
    this.dashboard.reload();
  }

  protected addWidget(): void {
    this.openDialog({ filters: this.activeFilters()! }, (draft) => {
      const size = this.registry.get(draft.type)?.defaultSize ?? { w: 4, h: 3 };
      this.session.apply((d) => addWidget(d, draft, size));
    });
  }

  protected editWidget(widget: Widget): void {
    this.openDialog({ filters: this.activeFilters()!, widget }, (draft) =>
      this.session.apply((d) => updateWidget(d, widget.id, { title: draft.title, settings: draft.settings, query: draft.query })));
  }

  protected duplicate(widget: Widget): void {
    this.session.apply((d) => duplicateWidget(d, widget.id, (title) => this.i18n.t('board.copyTitle', { title })));
  }

  protected remove(widget: Widget): void {
    if (this.session.apply((d) => removeWidget(d, widget.id))) {
      this.announcer.announce(this.i18n.t('widget.removed'));
    }
  }

  /** Arrow keys move the focused widget one cell, Shift and arrows resize it; mirrored in right-to-left. */
  protected nudge(widget: Widget, step: Partial<GridPosition>): void {
    const min = this.registry.get(widget.type)?.minSize;
    const moved = this.session.apply((d) => nudge(d, widget.id, step, min));
    this.announcer.announce(this.i18n.t(!moved ? 'widget.noRoom' : step.w || step.h ? 'widget.resized' : 'widget.moved'));
    // The grid re-renders the moved widget: keep the keyboard on it.
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>(`[data-widget="${widget.id}"]`)?.focus());
  }

  /**
   * Ctrl or Cmd + Z anywhere on the page undoes the last change while this board is being edited. Not in a text field
   * (there it undoes typing), and not while a dialog is open (the builder has its own fields).
   */
  protected shortcut(event: KeyboardEvent): void {
    const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]');
    const inDialog = this.dialog.openDialogs.length > 0;
    if (this.session.editing() && !typing && !inDialog && (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.session.undo();
    }
  }

  /** After a drag or a resize gridster has moved the cells in place: read them all back as one Undo step. */
  private layoutChanged(): void {
    // gridster calls this once per item it moved (a push moves several): read them together after the drag settles.
    queueMicrotask(() => {
      const positions = new Map(this.items().map((i) => [i.widget.id, { x: i.cell.x, y: i.cell.y, w: i.cell.cols, h: i.cell.rows }]));
      this.session.apply((d) => applyPositions(d, positions));
    });
  }

  private openDialog(data: WidgetDialogData, done: (draft: WidgetDraft) => void): void {
    const ref = this.dialog.open<WidgetDraft, WidgetDialogData>(WidgetDialog, {
      data,
      width: '980px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      direction: this.i18n.dir(),
      ariaLabelledBy: 'dash-widget-dialog-title',
      autoFocus: 'first-tabbable',
    });
    ref.closed.subscribe((draft) => draft && done(draft));
  }
}
