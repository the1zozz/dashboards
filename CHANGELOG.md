# Changelog

`@integralways/dashboards`. Each version is released once, from a tag named after it (`0.1.0`), with the package
attached to the GitHub release. The contract a project implements is versioned separately in CONTRACT.md.

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
