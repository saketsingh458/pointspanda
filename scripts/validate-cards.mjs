#!/usr/bin/env node
/**
 * Validates data/cards.json against structural rules.
 * Supports both schemas: new (snake_case, ui_elements) and legacy (camelCase, flat).
 * Run: node scripts/validate-cards.mjs
 * Exit code 0 if valid, 1 otherwise.
 */

import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const CARDS_PATH = join(ROOT, "data", "cards.json")

const LEGACY_REQUIRED = ["id", "name", "annualFee", "categoryMultipliers", "benefits"]
const LEGACY_CATEGORIES = ["travel", "dining", "groceries", "gas", "other"]

const NEW_REQUIRED = ["id", "name", "issuer", "annual_fee", "reward_currency", "ui_elements"]

function isNewSchema(card) {
  return card && typeof card.ui_elements === "object"
}

function validateLegacy(card, index) {
  const prefix = `Card ${index} (id: ${card?.id ?? "?"}) [legacy]`
  let failed = false
  for (const key of LEGACY_REQUIRED) {
    if (!(key in card)) {
      console.error(`${prefix}: missing required field "${key}".`)
      failed = true
    }
  }
  if (card?.categoryMultipliers && typeof card.categoryMultipliers === "object") {
    for (const cat of LEGACY_CATEGORIES) {
      if (typeof card.categoryMultipliers[cat] !== "number") {
        console.error(`${prefix}: categoryMultipliers.${cat} must be a number.`)
        failed = true
      }
    }
  }
  if (card && !Array.isArray(card.benefits)) {
    console.error(`${prefix}: benefits must be an array.`)
    failed = true
  }
  return failed
}

function validateNew(card, index) {
  const prefix = `Card ${index} (id: ${card?.id ?? "?"}) [new schema]`
  let failed = false
  for (const key of NEW_REQUIRED) {
    if (!(key in card)) {
      console.error(`${prefix}: missing required field "${key}".`)
      failed = true
    }
  }
  if (card?.ui_elements) {
    if (card.ui_elements.benefits_list != null && !Array.isArray(card.ui_elements.benefits_list)) {
      console.error(`${prefix}: ui_elements.benefits_list must be an array.`)
      failed = true
    }
  }
  const hasMultipliers = card?.multipliers != null
  const hasBenefitsList =
    card?.ui_elements != null &&
    Object.prototype.hasOwnProperty.call(card.ui_elements, "benefits_list")

  if (hasMultipliers) {
    if (typeof card.multipliers.base_rate !== "number") {
      console.error(`${prefix}: multipliers.base_rate must be a number.`)
      failed = true
    }
    if (card.multipliers.categories != null && typeof card.multipliers.categories !== "object") {
      console.error(`${prefix}: multipliers.categories must be an object.`)
      failed = true
    }
  }
  if (hasMultipliers === hasBenefitsList) {
    console.error(
      `${prefix}: exactly one of "multipliers" or "ui_elements.benefits_list" must be present.`
    )
    failed = true
  }
  if (card?.valuation != null && typeof card.valuation !== "object") {
    console.error(`${prefix}: valuation must be an object.`)
    failed = true
  }
  if (card?.statement_credits != null) {
    if (!Array.isArray(card.statement_credits)) {
      console.error(`${prefix}: statement_credits must be an array.`)
      failed = true
    } else {
      for (let i = 0; i < card.statement_credits.length; i++) {
        const sc = card.statement_credits[i]
        const required = ["name", "amount", "deducts_from_eligible_spend", "frequency"]
        for (const k of required) {
          if (!(k in sc)) {
            console.error(`${prefix}: statement_credits[${i}] missing "${k}".`)
            failed = true
          }
        }
      }
    }
  }
  return failed
}

function main() {
  let cards
  try {
    cards = JSON.parse(readFileSync(CARDS_PATH, "utf8"))
  } catch (e) {
    console.error("Failed to read or parse data/cards.json:", e.message)
    process.exit(1)
  }

  if (!Array.isArray(cards)) {
    console.error("data/cards.json must be a JSON array.")
    process.exit(1)
  }

  const ids = new Set()
  let failed = false

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    if (card?.id) {
      if (ids.has(card.id)) {
        console.error(`Card ${i} (id: ${card.id}): duplicate id.`)
        failed = true
      }
      ids.add(card.id)
    }
    if (isNewSchema(card)) {
      failed = validateNew(card, i) || failed
    } else {
      failed = validateLegacy(card, i) || failed
    }
  }

  if (failed) process.exit(1)
  console.log("Validation passed: data/cards.json is structurally valid.")
}

main()
