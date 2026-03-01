# Review changes and sync rules/docs

After code or test changes, ensure rules and docs stay in sync.

1. Check what changed: `git status` and `git diff` (or review the current changes in the editor).
2. If you changed:
   - **App/component contracts** (ids, data-testid, __TREEMAP_DEBUG__): update `finviz-like-treemap/docs/DEVELOPMENT_RULES.md` §5 and `finviz-like-treemap/docs/TEST_RULES.md` §4, §5.
   - **Test selectors or quality criteria**: update `finviz-like-treemap/docs/TEST_RULES.md` and, if needed, `finviz-like-treemap/docs/DEVELOPMENT_RULES.md`.
   - **Spec or data dimensions**: ensure `finviz-like-treemap/docs/00_SPECIFICATION_LAYERED.md` and any REFERENCES are consistent; use skills from `.cursor/rules/das-dashboard-spec-and-skills.mdc` if updating spec.
3. Run tests to confirm nothing broke: `npm run test:treemap-quality` (or `npm run test`).
4. Return a short summary: what was synced and test result.
