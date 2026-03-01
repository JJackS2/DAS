import fs from "node:fs";
import path from "node:path";

const dataPath = path.resolve("src/data/dummy.json");
const subsPath = path.resolve("src/data/dim_subsidiary.json");

function readData() {
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw);
}

function readSubsidiaries() {
  if (!fs.existsSync(subsPath)) return { meta: { source: "none", count: 0 }, subsidiaries: [] };
  const raw = fs.readFileSync(subsPath, "utf-8");
  return JSON.parse(raw);
}

export function registerRoutes(app) {
  app.get("/health", (_, res) => res.json({ ok: true }));

  // GET /subsidiaries — 법인 코드·이름 조회 (트리맵 라벨 등)
  app.get("/subsidiaries", (_, res) => {
    try {
      res.json(readSubsidiaries());
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // GET /data?dateKey=2026-02
  app.get("/data", (req, res) => {
    const { dateKey } = req.query;
    const data = readData();

    const resolved =
      dateKey && data.byDate[dateKey]
        ? dateKey
        : data.meta.availableDates[0];

    res.json({
      meta: data.meta,
      dateKey: resolved,
      rows: data.byDate[resolved] ?? [],
    });
  });
}
