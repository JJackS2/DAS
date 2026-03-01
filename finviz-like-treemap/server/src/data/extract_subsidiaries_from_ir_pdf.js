import fs from "node:fs";
import path from "node:path";
import pdfParse from "pdf-parse";

const DEFAULT_IR_PDF_URL =
  "https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2024_con_quarter04_all.pdf";

const OUT_PATH = path.resolve("src/data/dim_subsidiary.json");

/** PDF 수집 실패 또는 0건일 때 사용하는 기본 법인 목록 (코드·영문명) */
const FALLBACK_SUBSIDIARIES = [
  { subsidiary_code: "SEA", subsidiary_name_en: "Samsung Electronics America Inc." },
  { subsidiary_code: "SEUK", subsidiary_name_en: "Samsung Electronics UK Ltd." },
  { subsidiary_code: "SEG", subsidiary_name_en: "Samsung Electronics GmbH" },
  { subsidiary_code: "SESA", subsidiary_name_en: "Samsung Electronics Southeast Asia" },
  { subsidiary_code: "SEC", subsidiary_name_en: "Samsung Electronics China" },
  { subsidiary_code: "SEJ", subsidiary_name_en: "Samsung Electronics Japan" },
  { subsidiary_code: "SEK", subsidiary_name_en: "Samsung Electronics Korea" },
  { subsidiary_code: "SEL", subsidiary_name_en: "Samsung Electronics Latin America" },
  { subsidiary_code: "SEME", subsidiary_name_en: "Samsung Electronics Middle East" },
  { subsidiary_code: "SEI", subsidiary_name_en: "Samsung Electronics India" }
];

function normalizeLine(s) {
  return s.replace(/\s+/g, " ").trim();
}

function isLikelySubsidiaryLine(line) {
  return /\([A-Z0-9\-]{2,10}\)/.test(line) && /Samsung/i.test(line);
}

function extractPairsFromText(text) {
  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);
  const pairs = [];
  const seen = new Set();

  for (const line of lines) {
    if (!isLikelySubsidiaryLine(line)) continue;
    const m = line.match(/^(.*?)\s*(\([A-Z0-9\-]{2,10}\))\s*($|\d|%)/);
    if (!m) continue;
    const name = normalizeLine(m[1].replace(/\s+$/, "")).replace(/\s*\($/, "");
    const code = m[2].replace(/[()]/g, "");
    if (code.length < 2) continue;
    const key = code + "||" + name;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      subsidiary_code: code,
      subsidiary_name_en: name,
      source: "Samsung IR PDF",
      extracted_from_line: line
    });
  }

  const bestByCode = new Map();
  for (const p of pairs) {
    const cur = bestByCode.get(p.subsidiary_code);
    if (!cur || (p.subsidiary_name_en?.length ?? 0) > (cur.subsidiary_name_en?.length ?? 0)) {
      bestByCode.set(p.subsidiary_code, p);
    }
  }
  return Array.from(bestByCode.values()).sort((a, b) =>
    a.subsidiary_code.localeCompare(b.subsidiary_code)
  );
}

async function main() {
  const pdfUrl = process.env.IR_PDF_URL || DEFAULT_IR_PDF_URL;
  let list = [];

  try {
    console.log("Fetching:", pdfUrl);
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const parsed = await pdfParse(buf);
    list = extractPairsFromText(parsed.text);
  } catch (e) {
    console.warn("PDF fetch/parse failed:", e.message);
  }

  if (!list.length) {
    console.log("Using fallback subsidiary list (", FALLBACK_SUBSIDIARIES.length, "entries).");
    list = FALLBACK_SUBSIDIARIES.map((s) => ({
      ...s,
      source: "fallback",
      extracted_from_line: null
    }));
  }

  const payload = {
    meta: {
      source_url: pdfUrl,
      extracted_at: new Date().toISOString(),
      count: list.length,
      source: list.length && list[0].source === "fallback" ? "fallback" : "samsung_ir_pdf"
    },
    subsidiaries: list
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log("Wrote " + OUT_PATH + " (count=" + list.length + ")");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
