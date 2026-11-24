/*
 * @integralways/dashboards/ui: the components (board, widgets, charts). Import it from a lazy page: it brings the grid
 * and ECharts, which the app's first download should not carry. The app config imports only the core entry point.
 */
export { Board, GRID_COLUMNS, GRID_GAP, PHONE_WIDTH, ROW_HEIGHT } from './board/board';
export { WidgetFrame } from './widget-frame/widget-frame';
export { Chart, type ChartSpec } from './chart/chart';
export { BUILT_IN_WIDGETS, WidgetRegistry } from './widgets/widget-registry';
