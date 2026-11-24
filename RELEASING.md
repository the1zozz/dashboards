# Releasing

Tags are versions, e.g. `0.2.0`, never `v0.2.0`. One tag, one GitHub release with the package attached.

1. **main is green** (CI: both entry points build, unit tests, the demo within its budgets).
2. **Through a pull request:** `projects/dashboards/package.json` names the version, `CHANGELOG.md` says what changed
   in words a project using the package understands, and the install line in the README names the new release.
3. **After the merge, tag main and attach the package:**

   ```sh
   git checkout main && git pull
   npx ng build dashboards && (cd dist/dashboards && npm pack)
   git tag -a 0.2.0 -m "Release 0.2.0" && git push origin 0.2.0
   gh release create 0.2.0 dist/dashboards/integralways-dashboards-0.2.0.tgz --title 0.2.0 --notes-file <notes>
   ```

4. **Check:** install it in a project from the release URL and build that project.
