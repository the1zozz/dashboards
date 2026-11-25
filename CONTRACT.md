# Dashboards contract

What a project implements to use `@integralways/dashboards`, and what the package promises in return. Projects are
reviewed against this file; behaviour that is not here is not promised.

**Version 0.2 · 2026-11-25** (draft: changes freely until 1.0). 0.2 adds the optional `canRemove` and the list.

## 1. Two entry points

| Import | What it holds | Where to import it |
|---|---|---|
| `@integralways/dashboards` | The model, the plug-in interfaces, `provideDashboards`, query and layout helpers | Anywhere, including the app config. It carries no grid, no charts and no texts. |
| `@integralways/dashboards/ui` | The components (`<dash-board>`, the widgets, the builder, the chart) and their English and Arabic texts | Only from a lazy route or a `@defer` block. It brings the grid and ECharts (about 175 kB compressed), which the app's first download should not carry. |

## 2. The five plug-in points

A project passes them to `provideDashboards`:

```ts
provideDashboards({
  store: MyDashboardStore,      // where dashboards are saved
  data: MyWidgetData,           // runs one query document
  fields: MyFieldCatalog,       // what users can count, filter and split by
  access: MyAccess,             // who may create, edit and share
  widgets: [myOwnWidgetType],   // optional: the project's own widget types
  language: () => inject(MyLanguage).current(),   // 'en' or 'ar'; may read a signal and use inject()
});
```

Every method may answer with a `Promise` or an `Observable` (its first value is used).

1. **`DashboardStore`**: `list`, `get`, `save`, `create`, `remove`, `copy`, `share`. `save` must refuse (reject) a
   dashboard whose `version` is not the latest one saved, and must increment `version` on success: two people editing
   the same dashboard must not silently overwrite each other. Reject that case with an error carrying `status: 409`
   (an Angular `HttpErrorResponse` does) or `conflict: true`, so the editor can say "someone else saved" rather than
   "the save failed".
2. **`WidgetDataSource`**: `run(query, context)` answers one `QueryDocument` with a `WidgetResult`. The package has
   already added the dashboard's filters to the query (section 4). The project enforces its own limits (time, rows, a
   cap per user) and answers `{ kind: 'noAccess' }` for data the user may not see: the widget then says so, and the rest
   of the dashboard still works.
3. **`FieldCatalog`**: `measurables()` (things to count, each with its own fields) and `commonFields()` (fields every
   measurable has). Labels are already in the user's language.
4. **`DashboardAccess`**: `canCreate`, `canEdit(dashboard)`, `canShare(dashboard)`, and optionally
   `canRemove(dashboard)` (without it, those who may share may delete). The package hides what the user may not do;
   the project's server must still refuse it. A built-in dashboard is never edited, shared or deleted, whatever these
   answer: it is copied.
5. **Extra widget types**: a `WidgetType` with a standalone component that takes one input, `view: WidgetView`. A
   project type with a built-in type's name replaces the built-in one.

## 3. The model

A `Dashboard` is plain JSON (see `model.ts`): its summary (id, name, description, visibility, owner, built-in flag,
`updatedAt`), its `filters`, its `version`, and its `widgets`. A widget has an `id`, a `type`, a `title`, an optional
`query`, its type's `settings`, and a `position` on the 12-column grid (`x`, `y`, `w`, `h` in cells).

New dashboards are **private**; the owner shares them with the workspace.

## 4. Query documents and filters

A `QueryDocument` is one `measure` (`count`, `unique`, `sum` or `average` of a measurable, with a `field` for sum,
average and unique), `where` conditions, and optionally `by` (split by a field, with a `limit`) or `interval` (split
over time), and its own `period`.

The package runs `applyFilters(query, dashboard.filters)` before asking the data source: **both** the dashboard's and
the widget's conditions apply, and the widget's own period wins over the dashboard's. A filter bar never removes a
condition a widget has.

**The filter bar** above the grid holds the dashboard's period (a preset such as the last 7 days, or fixed dates), the
comparison with the period before, and conditions on the catalog's **common fields** (only those apply to every
widget). A widget with its own period says so beside its title. Who changes it decides what happens:

- **A reader** changes only what they see. Nothing is saved; "Reset" brings back the saved filters. A page that wants
  the reader's filters in its address binds `<dash-board [filters]="…" (filtersChange)="…">`: `filtersChange` sends the
  reader's filters, or `undefined` when they are back to the saved ones.
- **An editor** (edit mode) changes the filters saved with the dashboard, with Undo like every other change.

Fixed dates are whole UTC days: the first day at 00:00 to the day after the last at 00:00 (`from` inclusive, `to`
exclusive), the days a project's time buckets use. The data source receives the period as given and enforces its own
longest period.

## 5. Results

| `kind` | Shape | Drawn by |
|---|---|---|
| `number` | `value`, optional `previous` | Number |
| `series` | `buckets` and one or more named `series` of values | Trend (over time), Breakdown (by a field), Table |
| `table` | `columns` and `rows` | Table |
| `noAccess` | — | Every widget: "You don't have access to this data." |

A `series` with no buckets or a `table` with no rows is shown as "No data for this period"; a number, even 0, is shown.

## 6. Languages, direction and theme

English and Arabic are built in. In Arabic the grid, the time axis and the bars are mirrored and digits are
Arabic-Indic. Every colour, size and font comes from a `--dash-*` CSS variable (`styles/theme.css`, with light and dark
values); a project maps its own design tokens onto them. The package's buttons are single classes (`.dash-button`,
`.dash-link-button`, `.dash-icon-button`): they win over a project's element rules and lose to its class rules. Below
640 px the widgets stack in one column, in reading order.

`<dash-board>` takes `[id]`, `[header]`, `[filterBar]`, `[filters]` / `(filtersChange)` (section 4) and
`[startEditing]` (open in edit mode, for a dashboard just created). Beside the title it shows who can see the
dashboard; in the header, **Share** and **More** (make a copy, delete) for those allowed (`[actions]="false"` hides
them). It does not route: `(copied)` gives the copy (a page usually opens it to edit) and `(removed)` the deleted
dashboard's id (a page goes back to its list). Content marked `dashActions` is shown in the header's row next to Edit
when not editing, for the page's own actions.

## 7. The list of dashboards

`<dash-dashboard-list>` shows the dashboards `store.list()` answers, as cards: built-in first, then the most recently
changed. The reader searches by name, description and owner, and shows all, shared or private. Each card has a menu
with what the reader may do: open, edit, make a copy, share, delete. Those who may create have **New dashboard**
(`[createButton]="false"` hides it, for a page with its own).

The package does not route. `[link]` gives a dashboard's address (`(id) => '/dashboards/' + id`), so a card is a real
link that opens in a new tab with Ctrl, Cmd or the middle button; a plain click, and Open or Edit in a card's menu,
send `(open)` with `{ id, edit }` for the page to navigate. A dashboard just made opens with `edit: true`.

New, copy, share and delete each open their own dialog (`DashboardActions`, also used by the board). The dialog calls
the store and stays open with the reader's input when the store refuses, saying so; it closes only once it is done.
