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
