#!/usr/bin/env node
/**
 * Adds new cards from a TSV to data/cards.json (only cards not already present).
 * TSV columns: Card Name, Card ID, Issuer, Annual Fee, Reward Currency, CPP Floor, CPP Ceiling,
 * SUB Points, SUB Spend Req, SUB Timeframe, Base Multiplier, Category Multipliers & Caps,
 * Statement Credits, UI Benefits List, Image URL, Apply URL, Dev Notes, Card Network,
 * FTF %, Synergy Ecosystem, Anniversary Bonus
 * Usage: node scripts/add-new-cards.mjs [path-to.tsv]
 * Default TSV: scripts/new-cards-to-add.tsv
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CARDS_PATH = join(ROOT, "data", "cards.json");
const DEFAULT_TSV = join(__dirname, "new-cards-to-add.tsv");

function parseNum(s) {
  if (s == null || s === "" || s === "None" || s === "N/A") return 0;
  const n = parseFloat(String(s).replace(/[%,x]/gi, "").trim());
  return isNaN(n) ? 0 : n;
}

function parseSubPoints(s) {
  if (s == null || s === "" || s === "None" || s === "N/A") return 0;
  if (/unlimited match/i.test(String(s))) return 0;
  const n = parseInt(String(s).replace(/,/g, "").trim(), 10);
  return isNaN(n) ? 0 : n;
}

function parseBaseRate(s) {
  if (s == null || s === "" || s === "None") return 0;
  const t = String(s).trim().toLowerCase();
  const m = t.match(/([\d.]+)\s*[%x]?/);
  if (m) return parseFloat(m[1]);
  return 0;
}

function parseFtf(s) {
  if (s == null || s === "" || s === "None") return 0;
  const m = String(s).match(/([\d.]+)\s*%?/);
  return m ? parseFloat(m[1]) : 0;
}

function parseStatementCredits(str) {
  if (!str || str === "None" || str.trim() === "") return [];
  const credits = [];
  const parts = str.split(/,\s*\$\d+/).filter(Boolean);
  const regex = /\$(\d+)\s+([^(]+?)\s*\(([^)]+)\)/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    const name = m[2].trim();
    const amount = parseInt(m[1], 10);
    let frequency = m[3].toLowerCase();
    if (frequency.includes("every 4")) frequency = "every 4 years";
    else if (frequency.includes("every 5")) frequency = "every 5 years";
    const deducts = /travel|airline|dining|hotel|uber|resy|saks|clear|global entry|tsa|nexus/i.test(name);
    credits.push({ name, amount, frequency, deducts_from_eligible_spend: deducts });
  }
  return credits;
}

function parseCategories(str) {
  if (!str || str === "None" || str.trim() === "") return {};
  const categories = {};
  const parts = str.split(",").map((p) => p.trim()).filter(Boolean);
  const rateMatch = (s) => {
    const m = s.match(/([\d.]+)\s*[%x]/i);
    return m ? parseFloat(m[1]) : null;
  };
  const keyMap = {
    travel: "travel_portal",
    "travel via portal": "travel_portal",
    "chase travel": "travel_portal",
    "capital one travel": "capital_one_travel",
    "citi travel": "citi_travel",
    "amex travel": "amex_travel",
    dining: "dining",
    restaurants: "dining",
    groceries: "groceries",
    grocery: "groceries",
    gas: "gas_ev_transit",
    "ev charging": "gas_ev_transit",
    transit: "gas_ev_transit",
    streaming: "streaming",
    "office supplies": "office_supplies",
    "internet/cable/phone": "internet_cable_phone",
    "advertising": "advertising",
    shipping: "shipping",
    flights: "flights_direct",
    hotels: "hotels_direct",
    "car rental": "rental_cars",
    "vacation rentals": "vacation_rentals",
    "rotating": "rotating",
    "top category": "top_category",
    "top eligible category": "top_category",
    "entertainment": "entertainment",
    "drugstores": "drugstores",
    "supermarkets": "groceries",
    "u.s. supermarkets": "groceries",
    "online grocery": "online_groceries",
    "streaming services": "streaming",
    "lyft": "lyft",
  };
  for (const p of parts) {
    const rate = rateMatch(p);
    if (rate == null) continue;
    let key = "other";
    for (const [label, k] of Object.entries(keyMap)) {
      if (p.toLowerCase().includes(label)) {
        key = k;
        break;
      }
    }
    if (key === "other" && p.length < 30) key = p.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const capMatch = p.match(/up to \$\s*([\d,]+)/i) || p.match(/\$([\d,]+)\/?(?:month|yr|year|qtr|quarter)/i);
    const cat = { rate };
    if (capMatch) cat.cap_amount = parseInt(capMatch[1].replace(/,/g, ""), 10);
    if (!categories[key]) categories[key] = cat;
    else if (rate > (categories[key].rate || 0)) categories[key] = cat;
  }
  return categories;
}

function parseBenefitsList(str) {
  if (!str || str === "None" || str.trim() === "") return [];
  return str.split(/\s*[-–]\s*/).map((s) => s.trim()).filter(Boolean);
}

function buildCard(parts) {
  const id = (parts[1] || "").trim();
  const name = (parts[0] || "").trim();
  const issuer = (parts[2] || "").trim();
  const annualFee = parseNum(parts[3]);
  const rewardCurrency = (parts[4] || "").trim() || "None";
  const cppFloor = parseNum(parts[5]);
  const cppCeiling = parseNum(parts[6]);
  const subPoints = parseSubPoints(parts[7]);
  const subSpend = parseNum(parts[8]);
  const subMonths = parseNum(parts[9]);
  const baseRate = parseBaseRate(parts[10]);
  const categoryStr = parts[11] || "";
  const statementCreditsStr = parts[12] || "";
  const benefitsStr = parts[13] || "";
  const imageUrl = (parts[14] || "").trim();
  const applyUrl = (parts[15] || "").trim();
  const devNotes = (parts[16] || "").trim();
  const network = (parts[17] || "").trim();
  const ftf = parseFtf(parts[18]);
  const synergy = (parts[19] || "").trim();
  const anniversaryBonus = (parts[20] || "").trim();

  const statementCredits = parseStatementCredits(statementCreditsStr);
  const categories = parseCategories(categoryStr);
  const benefitsList = parseBenefitsList(benefitsStr);
  const hasMultiplierData = baseRate > 0 || Object.keys(categories).length > 0;

  const card = {
    id,
    name,
    issuer,
    network: network || undefined,
    annual_fee: annualFee,
    reward_currency: rewardCurrency,
    ...(synergy && synergy !== "None" ? { synergy_ecosystem: synergy } : {}),
    ftf_percentage: ftf,
    ui_elements: {
      image_url: imageUrl && imageUrl !== "N/A" ? imageUrl : null,
      apply_url: applyUrl && applyUrl !== "N/A" ? applyUrl : "",
      ...(!hasMultiplierData && {
        benefits_list: benefitsList.length ? benefitsList : (benefitsStr ? [benefitsStr] : [name + " benefits"]),
      }),
    },
    valuation: cppFloor > 0 || cppCeiling > 0 ? { cpp_floor: cppFloor, cpp_ceiling: cppCeiling } : undefined,
    welcome_offer: {
      points: subPoints,
      spend_requirement: subSpend,
      timeframe_months: subMonths,
    },
    anniversary_bonus: anniversaryBonus && anniversaryBonus !== "None" ? anniversaryBonus : null,
    statement_credits: statementCredits,
    ...(hasMultiplierData && {
      multipliers: {
        base_rate: baseRate,
        categories: Object.keys(categories).length ? categories : undefined,
      },
    }),
    ...(devNotes ? { developer_notes: devNotes } : {}),
  };
  if (card.multipliers && card.multipliers.categories === undefined) {
    delete card.multipliers.categories;
  }
  return card;
}

function main() {
  const tsvPath = process.argv[2] || DEFAULT_TSV;
  let tsv;
  try {
    tsv = readFileSync(tsvPath, "utf8");
  } catch (e) {
    console.error("Could not read TSV:", tsvPath, e.message);
    process.exit(1);
  }
  let cards;
  try {
    cards = JSON.parse(readFileSync(CARDS_PATH, "utf8"));
  } catch (e) {
    console.error("Could not read cards.json:", e.message);
    process.exit(1);
  }
  const existingIds = new Set(cards.map((c) => c.id));
  const lines = tsv.trim().split("\n").filter((l) => l.trim());
  let added = 0;
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const id = parts[1].trim();
    if (existingIds.has(id)) continue;
    if (parts.length < 18) {
      console.warn("Skipping row (not enough columns):", id);
      continue;
    }
    try {
      const card = buildCard(parts);
      cards.push(card);
      existingIds.add(id);
      added++;
    } catch (err) {
      console.warn("Skipping row", id, err.message);
    }
  }
  writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2) + "\n", "utf8");
  console.log("Added", added, "new cards to", CARDS_PATH);
}

main();
