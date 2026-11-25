# Dashboards

`@integralways/dashboards`: dashboards with dynamic widgets as a reusable Angular package, and a demo app that uses it
with no server.

- `projects/dashboards`: the package (core entry point and `ui` entry point)
- `projects/demo`: a project using it on made-up numbers, kept in memory
- [CONTRACT.md](CONTRACT.md): what a project implements and what the package promises

```bash
npm install
npm start                 # the demo
npx ng build dashboards   # the package
npx ng test dashboards    # tests
```

## Use it in a project

Install a release (the package is attached to each GitHub release):

```bash
npm install https://github.com/the1zozz/dashboards/releases/download/0.2.0/integralways-dashboards-0.2.0.tgz
```

Then add the theme to the app's global styles in `angular.json`, before the app's own stylesheet, and map your design
tokens onto the `--dash-*` variables (CONTRACT.md, section 6):

```json
"styles": ["node_modules/@integralways/dashboards/styles/theme.css", "src/styles.scss"]
```

`ng serve` reads `angular.json` only when it starts: restart it after adding the theme, or the dashboards draw with
the browser's plain buttons and no spacing.

