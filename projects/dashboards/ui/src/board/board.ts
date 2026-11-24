import { ChangeDetectionStrategy, Component, computed, inject, input, resource } from '@angular/core';
import { Gridster, GridsterItem } from 'angular-gridster2';
import { DASHBOARD_STORE, DashI18n, Dashboard, Widget, settle } from '@integralways/dashboards';
import { WidgetFrame } from '../widget-frame/widget-frame';

/** Columns of the grid: positions in the model are in these. */
export const GRID_COLUMNS = 12;
/** Height of one grid row in pixels. */
export const ROW_HEIGHT = 80;
/** Space between widgets in pixels. */
export const GRID_GAP = 16;
/** Below this width the widgets stack in one column, in reading order. */
export const PHONE_WIDTH = 640;

/**
 * A dashboard: loaded from the project's store and laid out on a 12-column grid, mirrored in right-to-left languages,
 * one column on a phone. Usage: {@code <dash-board [id]="dashboardId" />}.
 */
@Component({
  selector: 'dash-board',
  imports: [Gridster, GridsterItem, WidgetFrame],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board.html',
  styleUrl: './board.scss',
  host: { '[attr.dir]': 'i18n.dir()' },
})
export class Board {
  readonly id = input.required<string>();

  protected readonly i18n = inject(DashI18n);
  private readonly store = inject(DASHBOARD_STORE);

  protected readonly dashboard = resource({
    params: () => this.id(),
    loader: ({ params }) => settle<Dashboard>(this.store.get(params)),
  });

  protected readonly options = computed(() => ({
    gridType: 'verticalFixed' as const,
    fixedRowHeight: ROW_HEIGHT,
    keepFixedHeightInMobile: true,
    minCols: GRID_COLUMNS,
    maxCols: GRID_COLUMNS,
    minRows: 1,
    margin: GRID_GAP,
    outerMargin: false,
    mobileBreakpoint: PHONE_WIDTH,
    displayGrid: 'none' as const,
    compactType: 'compactUp' as const,
    dirType: this.i18n.dir(),
    draggable: { enabled: false },
    resizable: { enabled: false },
    disableScrollHorizontal: true,
  }));

  /**
   * The grid's height from its rows. gridster's own sizing (setGridSize) set a fixed width wider than the container,
   * which overflowed the page and, right to left, pushed widgets off screen.
   */
  protected readonly height = computed(() => {
    const rows = Math.max(0, ...this.items().map((i) => i.cell.y + i.cell.rows));
    return rows === 0 ? 0 : rows * (ROW_HEIGHT + GRID_GAP) - GRID_GAP;
  });

  /** The widgets in reading order (top to bottom, then start to end): the order they stack in on a phone. */
  protected readonly items = computed(() => {
    const d = this.dashboard.hasValue() ? this.dashboard.value() : undefined;
    if (!d) {
      return [];
    }
    return [...d.widgets]
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
      .map((widget: Widget) => ({ widget, cell: { x: widget.position.x, y: widget.position.y, cols: widget.position.w, rows: widget.position.h } }));
  });
}
