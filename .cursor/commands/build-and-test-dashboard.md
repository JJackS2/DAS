# Build and test dashboard (full flow)

Run the full build-and-test flow for the finviz-like-treemap dashboard.

1. From repository root: `npm run build:dashboard`
2. Then either:
   - **Option A (auto server)**: `npm run test:treemap-quality` — Playwright will start the static server on port 3000 if needed.
   - **Option B (manual server)**: In another terminal run `npm run serve` (serves `finviz-like-treemap/web/dist` on 3000), then `npm run test:treemap-quality`.
3. For data-backed quality metrics, start the data API: `cd finviz-like-treemap/server && npm run start` (8787) before running the test.
4. Summarize: build success/failure, test pass/fail count, and report path `reports/treemap/`.
