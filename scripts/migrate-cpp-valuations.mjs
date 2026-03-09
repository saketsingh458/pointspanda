#!/usr/bin/env node
/**
 * Migrates cards.json from cpp_floor/cpp_ceiling to cpp_nerdwallet/cpp_pointsguy/cpp_assumed.
 * Uses program lookup table; removes cpp_floor and cpp_ceiling.
 * Run: node scripts/migrate-cpp-valuations.mjs
 */

import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const CARDS_PATH = join(ROOT, "data", "cards.json")

/**
 * Program lookup: { cpp_nerdwallet, cpp_pointsguy, cpp_assumed }
 * null = not covered by that source
 */
const PROGRAM_LOOKUP = {
  "Chase UR": { cpp_nerdwallet: 1.8, cpp_pointsguy: 2.05, cpp_assumed: 1.25 },
  "Chase Ultimate Rewards": { cpp_nerdwallet: 1.8, cpp_pointsguy: 2.05, cpp_assumed: 1.25 },

  "Membership Rewards": { cpp_nerdwallet: 1.6, cpp_pointsguy: 2.0, cpp_assumed: 1.25 },
  "American Express Membership Rewards": { cpp_nerdwallet: 1.6, cpp_pointsguy: 2.0, cpp_assumed: 1.25 },
  "Amex Membership Rewards": { cpp_nerdwallet: 1.6, cpp_pointsguy: 2.0, cpp_assumed: 1.25 },

  "Capital One Miles": { cpp_nerdwallet: 1.6, cpp_pointsguy: 1.85, cpp_assumed: 1.25 },
  "Capital One": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Capital One Business": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Capital One Miles (via transfer)": { cpp_nerdwallet: 1.6, cpp_pointsguy: 1.85, cpp_assumed: 1.0 },

  "Citi ThankYou": { cpp_nerdwallet: 1.6, cpp_pointsguy: 1.9, cpp_assumed: 1.25 },
  "Citi ThankYou Rewards": { cpp_nerdwallet: 1.6, cpp_pointsguy: 1.9, cpp_assumed: 1.25 },

  "Wells Fargo Rewards": { cpp_nerdwallet: 1, cpp_pointsguy: 1.65, cpp_assumed: 1.0 },

  "Bilt Rewards": { cpp_nerdwallet: 1.8, cpp_pointsguy: 2.2, cpp_assumed: 1.25 },

  "Bank of America Preferred Rewards": { cpp_nerdwallet: 1, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "BofA Rewards": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Bank of America": { cpp_nerdwallet: 1, cpp_pointsguy: null, cpp_assumed: 1.0 },

  "U.S. Bank Altitude": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.25 },
  "U.S. Bank Smartly": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },

  "Robinhood Gold": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Gemini": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Apple Ecosystem": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "PayPal/Venmo": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "SoFi": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "PNC Rewards": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Truist": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Truist Rewards": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "PenFed Rewards": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },
  "Regions Relationship Rewards": { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 },

  "None": { cpp_nerdwallet: 0, cpp_pointsguy: 0, cpp_assumed: 0 },
}

function normalizeEcosystem(s) {
  if (!s || typeof s !== "string") return null
  return s.trim()
}

function getProgramValuation(card) {
  const ecosystem = normalizeEcosystem(card.synergy_ecosystem)
  const currency = normalizeEcosystem(card.reward_currency)

  // Card-specific overrides
  if (card.id === "us-bank-altitude-reserve-visa-infinite") {
    return { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.25 }
  }
  if (card.id === "us-bank-altitude-connect-visa-signature" || card.id === "us-bank-altitude-go-visa-signature") {
    return { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: 1.0 }
  }

  // Try ecosystem first
  if (ecosystem && PROGRAM_LOOKUP[ecosystem]) {
    return PROGRAM_LOOKUP[ecosystem]
  }

  // Cash back / fixed value / no rewards by currency
  const cashLike = /^(Cash Back|Cash Back \(Points\)|Cash Back Dollars|Reward Dollars|Cash Rewards|Cashback Bonus|Cash rewards|Daily Cash|Crypto \(.*\)|Atmos Rewards points)$/i
  const noRewards = /^(None|No rewards)$/i
  if (noRewards.test(currency) || (ecosystem === "None" && !currency)) {
    return { cpp_nerdwallet: 0, cpp_pointsguy: 0, cpp_assumed: 0 }
  }
  if (cashLike.test(currency) || (ecosystem === "None" && currency)) {
    return { cpp_nerdwallet: 1, cpp_pointsguy: 1, cpp_assumed: 1.0 }
  }

  // Minor/unmapped: use assumed from old cpp_floor if sensible, else 1.0
  const oldFloor = card.valuation?.cpp_floor
  const oldCeiling = card.valuation?.cpp_ceiling
  const assumedFromLegacy = oldFloor != null && oldFloor > 0.01 && oldFloor < 10 ? oldFloor : 1.0
  return { cpp_nerdwallet: null, cpp_pointsguy: null, cpp_assumed: assumedFromLegacy }
}

function migrateCard(card) {
  const valuation = card.valuation || {}
  const program = getProgramValuation(card)

  const newValuation = {}
  if (program.cpp_nerdwallet != null) newValuation.cpp_nerdwallet = program.cpp_nerdwallet
  if (program.cpp_pointsguy != null) newValuation.cpp_pointsguy = program.cpp_pointsguy
  if (program.cpp_assumed != null) newValuation.cpp_assumed = program.cpp_assumed

  // Remove legacy keys
  const { cpp_floor, cpp_ceiling, ...rest } = valuation
  const merged = { ...rest, ...newValuation }

  return {
    ...card,
    valuation: Object.keys(merged).length > 0 ? merged : { cpp_assumed: 0 },
  }
}

function main() {
  const cards = JSON.parse(readFileSync(CARDS_PATH, "utf8"))
  const migrated = cards.map(migrateCard)
  writeFileSync(CARDS_PATH, JSON.stringify(migrated, null, 2) + "\n", "utf8")
  console.log(`Migrated ${migrated.length} cards to multi-source CPP valuations.`)
}

main()
