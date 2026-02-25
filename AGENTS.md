# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

This is a monorepo with two sub-projects:

| Sub-project | Description | Runnable? |
|---|---|---|
| `dashboard_demo/` | Connection Conversion Monitoring dashboard (pure HTML/CSS/JS) | Yes — serve via any static HTTP server |
| `sros-analysis/` | Data analysis methodology framework & docs | No — documentation only |
| Root `index.html` | Simple landing page linking to GitHub | Yes — served with dashboard |

### Running the Dashboard

```
python3 -m http.server 8080
```

Then open `http://localhost:8080/dashboard_demo/index.html` in Chrome.

- **No build step required** — zero-build static files.
- **No package manager** — no `package.json`, `requirements.txt`, etc. for the dashboard.
- **CDN dependencies**: Pico CSS 1.5.11 and ECharts 5.4.3 load from `cdn.jsdelivr.net`. Internet access is required.
- All dashboard data is generated client-side via a seeded PRNG — no backend or database needed.

### Lint / Test / Build

- No linter, test framework, or build tool is configured in this repository.
- Manual testing is done by opening the dashboard in a browser and interacting with the UI (KPI cards, chart drill-down, filters, Pivot table, Treemap, Self-check).

### Caveats

- The root `index.html` is a separate landing page, not the dashboard entry point. The dashboard lives at `dashboard_demo/index.html`.
- `sros-analysis/analysis/design/requirements-analysis.txt` lists Python packages for future analysis work but no runnable scripts currently exist in that sub-project.
