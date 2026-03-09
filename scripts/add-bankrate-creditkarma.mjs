#!/usr/bin/env node
/**
 * Adds cpp_bankrate and cpp_creditkarma to cards.json based on program lookup.
 * Sources: Bankrate (https://www.bankrate.com/credit-cards/travel/points-and-miles-valuations/#card),
 * Credit Karma (https://www.creditkarma.com/credit-cards/i/credit-card-point-valuations)
 * Run: node scripts/add-bankrate-creditkarma.mjs
 */

import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const CARDS_PATH = join(ROOT, "data", "cards.json")

/**
 * Program lookup: { cpp_bankrate, cpp_creditkarma }
 * null = not covered by that source
 */
const PROGRAM_LOOKUP = {
  "Chase UR": { cpp_bankrate: 2.0, cpp_creditkarma: 1.71 },
  "Chase Ultimate Rewards": { cpp_bankrate: 2.0, cpp_creditkarma: 1.71 },

  "Membership Rewards": { cpp_bankrate: 2.0, cpp_creditkarma: 1.67 },
  "American Express Membership Rewards": { cpp_bankrate: 2.0, cpp_creditkarma: 1.67 },
  "Amex Membership Rewards": { cpp_bankrate: 2.0, cpp_creditkarma: 1.67 },

  "Capital One Miles": { cpp_bankrate: 1.7, cpp_creditkarma: 1.48 },
  "Capital One": { cpp_bankrate: null, cpp_creditkarma: null },
  "Capital One Business": { cpp_bankrate: null, cpp_creditkarma: null },
  "Capital One Miles (via transfer)": { cpp_bankrate: 1.7, cpp_creditkarma: 1.48 },

  "Citi ThankYou": { cpp_bankrate: 1.6, cpp_creditkarma: 1.55 },
  "Citi ThankYou Rewards": { cpp_bankrate: 1.6, cpp_creditkarma: 1.55 },

  "Wells Fargo Rewards": { cpp_bankrate: 1.0, cpp_creditkarma: null },

  "Bilt Rewards": { cpp_bankrate: 2.1, cpp_creditkarma: 1.78 },

  "Bank of America Preferred Rewards": { cpp_bankrate: 1.0, cpp_creditkarma: null },
  "BofA Rewards": { cpp_bankrate: 1.0, cpp_creditkarma: null },
  "Bank of America": { cpp_bankrate: 1.0, cpp_creditkarma: null },

  "U.S. Bank Altitude": { cpp_bankrate: 1.5, cpp_creditkarma: null },
  "U.S. Bank Smartly": { cpp_bankrate: null, cpp_creditkarma: null },

  "Robinhood Gold": { cpp_bankrate: null, cpp_creditkarma: null },
  "Gemini": { cpp_bankrate: null, cpp_creditkarma: null },
  "Apple Ecosystem": { cpp_bankrate: null, cpp_creditkarma: null },
  "PayPal/Venmo": { cpp_bankrate: null, cpp_creditkarma: null },
  "SoFi": { cpp_bankrate: null, cpp_creditkarma: null },
  "PNC Rewards": { cpp_bankrate: null, cpp_creditkarma: null },
  "Truist": { cpp_bankrate: null, cpp_creditkarma: null },
  "Truist Rewards": { cpp_bankrate: null, cpp_creditkarma: null },
  "PenFed Rewards": { cpp_bankrate: null, cpp_creditkarma: null },
  "Regions Relationship Rewards": { cpp_bankrate: null, cpp_creditkarma: null },
  "PenFed Honors Advantage": { cpp_bankrate: null, cpp_creditkarma: null },

  "None": { cpp_bankrate: 0, cpp_creditkarma: 0 },
}

function normalizeEcosystem(s) {
  if (!s || typeof s !== "string") return null
  return s.trim()
}

function getProgramValuation(card) {
  const ecosystem = normalizeEcosystem(card.synergy_ecosystem)
  const currency = normalizeEcosystem(card.reward_currency)

  if (ecosystem && PROGRAM_LOOKUP[ecosystem]) {
    return PROGRAM_LOOKUP[ecosystem]
  }

  const cashLike = /^(Cash Back|Cash Back \(Points\)|Cash Back Dollars|Reward Dollars|Cash Rewards|Cashback Bonus|Cash rewards|Daily Cash|Crypto \(.*\)|Atmos Rewards points)$/i
  const noRewards = /^(None|No rewards)$/i
  if (noRewards.test(currency) || (ecosystem === "None" && !currency)) {
    return { cpp_bankrate: 0, cpp_creditkarma: 0 }
  }
  if (cashLike.test(currency) || (ecosystem === "None" && currency)) {
    return { cpp_bankrate: null, cpp_creditkarma: null }
  }

  if (currency && /discover miles/i.test(currency)) {
    return { cpp_bankrate: 1, cpp_creditkarma: null }
  }

  return { cpp_bankrate: null, cpp_creditkarma: null }
}

function updateCard(card) {
  const valuation = { ...(card.valuation || {}) }
  const program = getProgramValuation(card)

  if (program.cpp_bankrate != null) valuation.cpp_bankrate = program.cpp_bankrate
  if (program.cpp_creditkarma != null) valuation.cpp_creditkarma = program.cpp_creditkarma

  return { ...card, valuation }
}

function main() {
  const cards = JSON.parse(readFileSync(CARDS_PATH, "utf8"))
  const updated = cards.map(updateCard)
  writeFileSync(CARDS_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8")
  console.log(`Added Bankrate and Credit Karma CPP to ${updated.length} cards.`)
}

main()
