# Run treemap quality test

Run the treemap quality E2E test from the project root.

1. Ensure you are at the repository root (e.g. `c:\workspace\DAS`).
2. Run: `npm run test:treemap-quality`
3. If you want the data API for meaningful leaf layouts, start the server first in another terminal: `cd finviz-like-treemap/server && npm run start` (port 8787).
4. Optionally run build before test: `npm run build:dashboard` then `npm run test:treemap-quality`.
5. Report output: `reports/treemap/treemap_quality_report.md` and `.json`.

Return the test exit code and a one-line summary (e.g. "X passed, Y failed" or "noData pass").
