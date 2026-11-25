# Changelog

`@integralways/dashboards`. Each version is released once, from a tag named after it (`0.1.0`), with the package
attached to the GitHub release. The contract a project implements is versioned separately in CONTRACT.md.

## 0.4.0 · 25 November 2026

Contract 0.3: `interval: 'auto'`.

- **Automatic interval** for a Trend: hours for up to 2 days, days up to 3 months, weeks up to a year, else months,
  following the period the reader picks in the filter bar. New Trends start with it. The package resolves it
  (`autoInterval`), so a project's data source never sees 'auto'.

## 0.3.0 · 25 November 2026

Phase 1, step 4: the list of dashboards and sharing in the package. Contract 0.2: `DashboardAccess.canRemove`
(optional) and the list (section 7).

- **`<dash-dashboard-list>`**: the dashboards as cards with who can see them, owner and last change; search; all,
  shared or private; New dashboard; and a menu per card (open, edit, make a copy, share, delete) showing only what the
  reader may do. Loading, failed (with Try again), empty and no-match states.
- **Dialogs** for a new dashboard, a copy, sharing (only you, or everyone in the workspace) and deleting (it says when
  a shared dashboard is deleted for everyone). They call the store themselves and keep the reader's input when it
  refuses. `DashboardActions` opens them, for a project's own buttons too.
- **The board's header** shows who can see the dashboard beside its title, and Share and More (make a copy, delete)
  for those allowed; `(copied)` and `(removed)` tell the page where to go.
- A built-in dashboard is never edited, shared or deleted, whatever the project's access answers: it is copied.
- `DashI18n.ago` ("3 days ago") and `dateTime`.

## 0.2.1 · 25 November 2026

- **Long values no longer push numbers out of a widget.** A Table cuts long text short with an ellipsis (the whole
  value on hover) and keeps its number columns in view; a Breakdown cuts long bar labels at 140 px. Found with a split
  by a field whose values are hashed for privacy (64 characters).

## 0.2.0 · 25 November 2026

Phase 1, step 3: the filter bar. Contract 0.1 (draft), no change to the model or the plug-ins.

- **Filter bar** above the grid: the period (last 24 hours, 7, 30 or 90 days, 12 months, or fixed dates), the
  comparison with the previous period, and conditions on the catalog's common fields as chips. A reader's changes are
  theirs alone, with Reset; an editor's are saved with the dashboard and undone with Undo.
- **`<dash-board [filters] (filtersChange)>`** for a page that keeps the reader's filters in its address; `[filterBar]`
  hides the bar.
- A widget that keeps its own period shows it beside its title.
- **Fits in a project's pages.** The package's buttons are plain classes now, not `:where()`: a project's reset
  (`button { color: inherit; font-size: inherit }`) no longer turned a primary button into blue text on blue.
  `--dash-text-title` sizes the dashboard's title to match the project's page titles.
- **`<dash-board [startEditing]>`** opens in edit mode (a dashboard just created), and an empty dashboard offers
  "Add widget" to those who may edit it. A page's own actions (share, delete) go in the header's row as content marked
  `dashActions`.
- The add-widget drawer shows the five types in one row, Number has a clearer icon, and a widget's own period reads
  "Its own period: Last 30 days".
- Core helpers: `PERIOD_PRESETS`, `datesPeriod`, `periodDays`, `periodRange`, `samePeriod`, `sameCondition`,
  `sameFilters`. Period words with the right Arabic plural forms.

## 0.1.0 · 24 November 2026

The first release: Phase 1 of the dashboards plan, steps 1 and 2. Contract 0.1 (draft).

- **Two entry points.** `@integralways/dashboards` holds the model, the plug-in interfaces, `provideDashboards` and
  the query and layout helpers, and is what the app config imports. `@integralways/dashboards/ui` holds the components
  and their English and Arabic texts, and loads with a lazy page (the grid and ECharts are about 200 kB compressed).
- **`<dash-board [id]>`:** a 12-column grid, mirrored in Arabic, one column on a phone. Each widget shows loading,
  failed with a retry, no access and no data.
- **Widgets:** Number (with its change against the previous period), Trend, Breakdown, Table, Note.
- **Edit mode** for those the project allows: add a widget (choose a type, build it with a live preview), edit,
  duplicate, remove, drag and resize, or move and resize with the keyboard; Undo; a save that someone else's newer save
  refuses without losing the editor's work.
- **Theme:** every colour, size and font a `--dash-*` variable in `styles/theme.css`, light and dark.
