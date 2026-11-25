/*
 * @integralways/dashboards/ui: the components (board, widgets, charts). Import it from a lazy page: it brings the grid
 * and ECharts, which the app's first download should not carry. The app config imports only the core entry point.
 */
export { Board, GRID_COLUMNS, GRID_GAP, PHONE_WIDTH, ROW_HEIGHT } from './board/board';
export { WidgetFrame } from './widget-frame/widget-frame';
export { FilterBar } from './filter-bar/filter-bar';
export { Chart, type ChartSpec } from './chart/chart';
export { BUILT_IN_WIDGETS, WidgetRegistry } from './widgets/widget-registry';
export { WidgetBuilder, type WidgetDraft } from './builder/widget-builder';
export { WidgetDialog, type WidgetDialogData } from './widget-dialog/widget-dialog';
export { Select, type SelectOption } from './controls/select/select';
export { EditSession, type SaveProblem } from './board/edit-session';
export { DashI18n } from './i18n/dash-i18n';
export { LAST_PERIOD, MESSAGES, type Language, type MessageKey } from './i18n/messages';
