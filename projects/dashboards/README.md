# @integralways/dashboards

Dashboards with dynamic widgets for any Angular 22 app: a 12-column grid, built-in Number, Trend, Breakdown, Table and
Note widgets, English and Arabic, light and dark. The app plugs in where dashboards are saved and where the numbers come
from; the package knows nothing about any backend. What a project implements is in [CONTRACT.md](../../CONTRACT.md).

## Use it

0. Install it from the release (it is not on npm):

   ```sh
   npm install https://github.com/the1zozz/dashboards/releases/download/0.1.0/integralways-dashboards-0.1.0.tgz
   ```

1. Add the theme to `angular.json` styles, and map your tokens onto it:

   ```json
   "styles": ["node_modules/@integralways/dashboards/styles/theme.css", "src/styles.scss"]
   ```

   ```css
   :root { --dash-accent: var(--brand-primary); --dash-surface: var(--card-bg); --dash-font: var(--font-sans); }
   ```

2. Implement the four plug-ins and provide them in the app config (the core entry point is light):

   ```ts
   import { provideDashboards } from '@integralways/dashboards';

   provideDashboards({ store: MyStore, data: MyData, fields: MyFields, access: MyAccess,
                       language: () => inject(MyLanguage).current() });
   ```

3. Show a dashboard from a lazy page (the `ui` entry point brings the grid and charts):

   ```ts
   import { Board } from '@integralways/dashboards/ui';
   ```

   ```html
   <dash-board [id]="dashboardId" />
   ```

## Develop

```bash
npm start                 # the demo app on made-up data: http://localhost:4200
npx ng build dashboards   # the package, into dist/dashboards
npx ng test dashboards    # unit tests
```
