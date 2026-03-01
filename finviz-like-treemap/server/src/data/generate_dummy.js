import fs from "node:fs";
import path from "node:path";

const OUT_DUMMY = path.resolve("src/data/dummy.json");
const DIM_SUBS = path.resolve("src/data/dim_subsidiary.json");

const REGIONS = ["North America", "Latin America", "Europe", "Asia", "Middle East", "Korea"];
/** 지역별 규모 차등: 판매·연결대수 등이 지역마다 다르게 나오도록 (0.3 ~ 2.2) */
const REGION_SCALE = {
  "North America": 2.0,
  "Latin America": 0.45,
  "Europe": 1.3,
  "Asia": 2.2,
  "Middle East": 0.35,
  "Korea": 1.6
};
const DIVISIONS = ["Living", "Kitchen", "Air"];
const L2 = {
  Living: ["Refrigerator", "Washer", "Vacuum", "Airdresser"],
  Kitchen: ["Oven", "Cooktop", "Hood", "Microwave"],
  Air: ["AirConditioner", "AirPurifier", "Dehumidifier"]
};
const L3 = {
  Refrigerator: ["FrenchDoor", "SideBySide", "TopMount"],
  Washer: ["FrontLoad", "TopLoad"],
  Vacuum: ["Robot", "Stick"],
  Airdresser: ["Standard"],
  Oven: ["BuiltIn", "Countertop"],
  Cooktop: ["Induction", "Gas"],
  Hood: ["WallMount", "UnderCabinet"],
  Microwave: ["Solo", "Grill"],
  AirConditioner: ["Split", "Window"],
  AirPurifier: ["Tower", "Compact"],
  Dehumidifier: ["Standard"]
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function computeRates(sales, wifiSales, connected) {
  const attach = sales > 0 ? wifiSales / sales : null;
  const connect = wifiSales > 0 ? connected / wifiSales : null;
  return { attach, connect };
}

/** dim_subsidiary.json 있으면 { codes, byCode: { code -> { subsidiary_name_en, ... } } } 반환 */
function loadSubsidiaries() {
  if (!fs.existsSync(DIM_SUBS)) return null;
  try {
    const raw = fs.readFileSync(DIM_SUBS, "utf-8");
    const json = JSON.parse(raw);
    const list = json.subsidiaries ?? [];
    const codes = Array.from(new Set(list.map((x) => x.subsidiary_code).filter(Boolean)));
    const byCode = {};
    for (const s of list) {
      if (s.subsidiary_code) byCode[s.subsidiary_code] = s;
    }
    return codes.length ? { codes, byCode } : null;
  } catch {
    return null;
  }
}

function makeSubsidiary(region, subs) {
  if (subs && subs.codes && subs.codes.length) {
    const slice = subs.codes.slice(0, Math.min(subs.codes.length, 400));
    return pick(slice);
  }
  const prefix = "SE";
  const regionCode = {
    "North America": "A",
    "Latin America": "L",
    "Europe": "E",
    "Asia": "S",
    "Middle East": "M",
    "Korea": "K"
  }[region] ?? "X";
  return `${prefix}${regionCode}${randInt(1, 18)}`;
}

function genRowsForDate(dateKey, targetRows, subs) {
  const rows = [];
  const seed = (dateKey.split("-").join("") || "202601").slice(0, 6);
  let rng = parseInt(seed, 10) % 100000;
  function nextRand() {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  }
  while (rows.length < targetRows) {
    const region = pick(REGIONS);
    const subsidiary = makeSubsidiary(region, subs);

    const division = pick(DIVISIONS);
    const productL2 = pick(L2[division]);
    const productL3 = pick(L3[productL2]);

    const scale = REGION_SCALE[region] ?? 1;
    const baseSales = Math.floor(4000 + nextRand() * 40000);
    const sales = Math.max(1, Math.round(baseSales * scale));
    const wifiRatio = 0.1 + nextRand() * 0.85;
    const wifiSales = Math.min(sales, Math.max(0, Math.floor(sales * wifiRatio)));
    const connectRatio = 0.05 + nextRand() * 0.9;
    const connected = Math.min(wifiSales, Math.max(0, Math.floor(wifiSales * connectRatio)));

    const { attach, connect } = computeRates(sales, wifiSales, connected);

    rows.push({
      date_key: dateKey,
      region,
      subsidiary,
      division,
      product_l2: productL2,
      product_l3: productL3,
      sales,
      wifi_sales: wifiSales,
      connected,
      attach_rate: attach,
      connect_rate: connect
    });
  }
  return rows;
}

const availableDates = ["2026-01", "2026-02", "2026-03"];
const byDate = {};

const subsidiaries = loadSubsidiaries();
for (const d of availableDates) {
  byDate[d] = genRowsForDate(d, 50000, subsidiaries);
}

const payload = {
  meta: {
    availableDates,
    metrics: ["sales", "wifi_sales", "connected", "attach_rate", "connect_rate"],
    defaultSize: "sales",
    defaultColor: "connect_rate",
    topNDefault: 50
  },
  byDate
};

fs.writeFileSync(OUT_DUMMY, JSON.stringify(payload));
console.log(`Wrote ${OUT_DUMMY} (${availableDates.length} dates)`);
