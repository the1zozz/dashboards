/*
 * @integralways/dashboards/ui: the components (board, widgets, charts). Import it from a lazy page: it brings the grid
 * and ECharts, which the app's first download should not carry. The app config imports only the core entry point.
 */
export { Board, GRID_COLUMNS, GRID_GAP, PHONE_WIDTH, ROW_HEIGHT } from './board/board';
export { WidgetFrame } from './widget-frame/widget-frame';
export { FilterBar } from './filter-bar/filter-bar';
export { DashboardList, type DashboardOpen } from './dashboard-list/dashboard-list';
export { DashboardCard, type CardOpen } from './dashboard-card/dashboard-card';
export { DashboardActions } from './actions/dashboard-actions';
export { DashboardForm, DESCRIPTION_MAX, NAME_MAX, type DashboardFormData } from './dashboard-form/dashboard-form';
export { ShareDialog } from './share-dialog/share-dialog';
export { DeleteDialog } from './delete-dialog/delete-dialog';
export { VisibilityBadge } from './visibility-badge/visibility-badge';
export { Chart, type ChartSpec } from './chart/chart';
export { BUILT_IN_WIDGETS, WidgetRegistry } from './widgets/widget-registry';
export { WidgetBuilder, type WidgetDraft } from './builder/widget-builder';
export { WidgetDialog, type WidgetDialogData } from './widget-dialog/widget-dialog';
export { Select, type SelectOption } from './controls/select/select';
export { EditSession, type SaveProblem } from './board/edit-session';
export { DashI18n } from './i18n/dash-i18n';
export { LAST_PERIOD, MESSAGES, type Language, type MessageKey } from './i18n/messages';
