import { InjectionToken, Type } from '@angular/core';
import { Observable } from 'rxjs';
import { Dashboard, DashboardSummary, GridPosition, QueryDocument, Visibility, WidgetResult } from './model';

/** Every plug-in may answer with a promise or an observable (the first value is used). */
export type Answer<T> = Promise<T> | Observable<T>;

/**
 * Where dashboards are saved: the project's own API, or the optional Spring Boot starter's. The package never stores
 * anything itself.
 */
export interface DashboardStore {
  list(): Answer<DashboardSummary[]>;
  get(id: string): Answer<Dashboard>;
  /** Saves the whole dashboard; refuses (rejects) a save whose {@link Dashboard.version} is not the latest. */
  save(dashboard: Dashboard): Answer<Dashboard>;
  create(name: string, description?: string): Answer<Dashboard>;
  remove(id: string): Answer<void>;
  copy(id: string, name: string): Answer<Dashboard>;
  share(id: string, visibility: Visibility): Answer<Dashboard>;
}

/** Answers one widget's query document, with the dashboard's filters already applied by the package. */
export interface WidgetDataSource {
  run(query: QueryDocument, context: QueryContext): Answer<WidgetResult>;
}

/** What the package adds to a widget's own query: the comparison the dashboard asks for. */
export interface QueryContext {
  compare: 'none' | 'previous';
  /** The language the user reads in, for projects that translate field values. */
  language: string;
}

/** A field users can count, filter on or split by. */
export interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  /** Values to offer in a filter, when the project knows them. */
  values?: string[];
}

/** A thing users can measure, e.g. an event or record type, with the fields it carries. */
export interface Measurable {
  name: string;
  label: string;
  fields: Field[];
}

/** What can be counted, filtered and split. Labels are already in the user's language. */
export interface FieldCatalog {
  measurables(): Answer<Measurable[]>;
  /** Fields every measurable has (time, place, device …). */
  commonFields(): Answer<Field[]>;
}

/** Who may do what. A widget the user may not see answers {@link WidgetResult} 'noAccess' from the data source. */
export interface DashboardAccess {
  canCreate(): boolean;
  canEdit(dashboard: DashboardSummary): boolean;
  canShare(dashboard: DashboardSummary): boolean;
  /** Whether the user may delete it. Optional: without it, those who may share a dashboard may delete it. */
  canRemove?(dashboard: DashboardSummary): boolean;
}

/** A widget type: the built-in ones and a project's own. */
export interface WidgetType {
  type: string;
  /** Shown in the add-widget drawer; a label key of the package or a ready string. */
  label: string;
  description: string;
  /** An inline SVG path (24×24 view box) for the drawer. */
  icon: string;
  /** The component that draws one widget; it gets {@link WidgetView} as its input `view`. */
  component: Type<unknown>;
  defaultSize: Pick<GridPosition, 'w' | 'h'>;
  minSize?: Pick<GridPosition, 'w' | 'h'>;
  /** Whether it asks the data source for a result (a note does not). */
  needsData: boolean;
}

/** What a widget component receives. */
export interface WidgetView {
  title: string;
  settings: Record<string, unknown>;
  result: WidgetResult | null;
  language: string;
}

/** What a project gives {@link provideDashboards}. */
export interface DashboardsConfig {
  store: Type<DashboardStore>;
  data: Type<WidgetDataSource>;
  fields: Type<FieldCatalog>;
  access: Type<DashboardAccess>;
  /** The project's own widget types, added after the built-in ones. */
  widgets?: WidgetType[];
  /**
   * The language to show ('en' or 'ar'). A function, read inside a computed and the app's injector, so it may read a
   * signal and use inject(): the package then follows the project's language switch.
   */
  language?: () => string;
}

export const DASHBOARD_STORE = new InjectionToken<DashboardStore>('dash.store');
export const WIDGET_DATA = new InjectionToken<WidgetDataSource>('dash.data');
export const FIELD_CATALOG = new InjectionToken<FieldCatalog>('dash.fields');
export const DASHBOARD_ACCESS = new InjectionToken<DashboardAccess>('dash.access');
export const EXTRA_WIDGETS = new InjectionToken<WidgetType[]>('dash.extraWidgets');
export const DASHBOARD_LANGUAGE = new InjectionToken<() => string>('dash.language');
