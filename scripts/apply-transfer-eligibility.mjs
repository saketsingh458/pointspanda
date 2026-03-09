#!/usr/bin/env node
/**
 * Apply points_transfer_eligibility and transfer_eligibility_note to each card in data/cards.json
 * based on research (web search by ecosystem). Run from repo root.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const cardsPath = path.join(repoRoot, "data", "cards.json");

const ELIGIBILITY = {
  direct: [
    "chase-sapphire-reserve",
    "chase-sapphire-preferred-card",
    "sapphire-reserve-for-business",
    "ink-business-preferred-credit-card",
    "amex-platinum-card",
    "amex-gold-card",
    "amex-green-card",
    "american-express-business-gold-card",
    "amex-everyday-credit-card",
    "amex-everyday-preferred-credit-card",
    "amex-centurion-card",
    "amex-business-platinum",
    "blue-business-plus-credit-card",
    "capital-one-venture-x-rewards-credit-card",
    "capital-one-venture-rewards",
    "capital-one-ventureone-rewards-credit-card",
    "venture-x-business",
    "capital-one-spark-miles-for-business",
    "citi-strata-elite-card",
    "citi-strata-premier-card",
    "wells-fargo-autograph-journey",
    "wells-fargo-autograph-card",
    "bilt-blue-card",
    "bilt-palladium-card",
  ],
  pooling_only: [
    { id: "chase-freedom-unlimited", note: "When combined with Sapphire or Ink Business Preferred" },
    { id: "chase-freedom-flex", note: "When combined with Sapphire or Ink Business Preferred" },
    { id: "chase-freedom-rise", note: "When combined with Sapphire or Ink Business Preferred" },
    { id: "ink-business-unlimited-credit-card", note: "When combined with Sapphire or Ink Business Preferred" },
    { id: "ink-business-cash", note: "When combined with Sapphire or Ink Business Preferred" },
    { id: "citi-double-cash-card", note: "When combined with Citi Strata Premier or Strata Elite" },
    { id: "citi-custom-cash-card", note: "When combined with Citi Strata Premier or Strata Elite" },
    { id: "citi-rewards-plus", note: "When combined with Citi Strata Premier or Strata Elite" },
    { id: "wells-fargo-active-cash", note: "When combined with Autograph Journey or Autograph" },
    { id: "wells-fargo-attune-card", note: "When combined with Wells Fargo Autograph" },
    { id: "wells-fargo-reflect-card", note: "When combined with Autograph Journey" },
    { id: "capital-one-savor-cash-rewards", note: "When converted to Capital One miles via eligible miles-earning card" },
  ],
};

const poolingMap = new Map(ELIGIBILITY.pooling_only.map((p) => [p.id, p.note]));
const directSet = new Set(ELIGIBILITY.direct);

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

for (const card of cards) {
  const id = card.id;
  if (directSet.has(id)) {
    card.points_transfer_eligibility = "direct";
    delete card.transfer_eligibility_note;
  } else if (poolingMap.has(id)) {
    card.points_transfer_eligibility = "pooling_only";
    card.transfer_eligibility_note = poolingMap.get(id);
  } else {
    card.points_transfer_eligibility = "none";
    delete card.transfer_eligibility_note;
  }
}

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2) + "\n", "utf8");
console.log("Updated", cards.length, "cards with points_transfer_eligibility");
