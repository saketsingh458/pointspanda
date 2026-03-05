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
const TRAVEL_TOKEN_RE = /(travel|flight|airfare|airline|hotel|portal|rental|cruise)/
const GENERAL_OTHER_KEYS = new Set(["other", "1_all_other", "all_purchases"])
const GENERAL_OTHER_KEY_RE = /^[0-9]+x_on_all_purchases$/
const OTHER_LIKE_KEY_RE = /(^|_)other(_|$)|all[_-]?purchases?/

const CANONICAL_TRAVEL_KEYS = new Set([
  "travel_portal",
  "travel_portal_hotels_cars",
  "travel_portal_flights",
  "flights_direct",
  "hotels_direct",
  "flights_direct_or_portal",
  "hotels_prepaid_portal",
  "travel",
])

const PORTAL_ONLY_KEYS = new Set([
  "travel_portal",
  "travel_portal_hotels_cars",
  "travel_portal_flights",
  "hotels_prepaid_portal",
])

const TRAVEL_KEY_ALIASES = {
  travel_general: "travel",
  flights_hotels_direct: "flights_direct and hotels_direct",
  flights: "flights_direct_or_portal",
  hotels_prepaid: "hotels_prepaid_portal",
  hotels_vacation_rentals_rental_cars_portal: "travel_portal_hotels_cars",
  "2x_airfare": "flights_direct",
  rental_cars: "travel",
  travel_shipping_advertising_internet_cable_phone: "travel",
}

const CAP_PERIODS = new Set(["monthly", "quarterly", "annual"])
const TRAVEL_SUBTYPES = new Set(["flight", "hotel", "car", "general"])
const BOOKING_CHANNELS = new Set(["portal", "direct", "either"])

const CARD_SPECIFIC_TRAVEL_RULES = {
  "citi-strata-elite-card": {
    required: ["travel_portal_hotels_cars", "travel_portal_flights"],
    forbidden: ["travel_portal"],
    message:
      "must split portal travel into travel_portal_hotels_cars and travel_portal_flights to avoid overstating portal flight earn.",
  },
}

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
    const cats = card?.multipliers?.categories
    if (cats && typeof cats === "object") {
      for (const [key, config] of Object.entries(cats)) {
        if (typeof config !== "object" || config == null) {
          console.error(`${prefix}: multipliers.categories.${key} must be an object.`)
          failed = true
          continue
        }
        if (typeof config.rate !== "number") {
          console.error(`${prefix}: multipliers.categories.${key}.rate must be a number.`)
          failed = true
        }
        if (
          config.requires_portal != null &&
          typeof config.requires_portal !== "boolean"
        ) {
          console.error(
            `${prefix}: multipliers.categories.${key}.requires_portal must be a boolean when present.`
          )
          failed = true
        }
        if (
          config.cap_amount != null &&
          (typeof config.cap_amount !== "number" || !Number.isFinite(config.cap_amount) || config.cap_amount <= 0)
        ) {
          console.error(
            `${prefix}: multipliers.categories.${key}.cap_amount must be a positive number when present.`
          )
          failed = true
        }
        if (config.cap_amount != null && config.cap_period == null) {
          console.warn(
            `${prefix}: multipliers.categories.${key} has cap_amount but no cap_period; strategy will infer a period.`
          )
        }
        if (config.cap_period != null) {
          if (typeof config.cap_period !== "string" || !CAP_PERIODS.has(config.cap_period)) {
            console.error(
              `${prefix}: multipliers.categories.${key}.cap_period must be one of ${Array.from(
                CAP_PERIODS
              ).join(", ")} when present.`
            )
            failed = true
          }
          if (config.cap_amount == null) {
            console.error(
              `${prefix}: multipliers.categories.${key}.cap_period requires cap_amount to be present.`
            )
            failed = true
          }
        }
        if (config.travel_subtype != null) {
          if (
            typeof config.travel_subtype !== "string" ||
            !TRAVEL_SUBTYPES.has(config.travel_subtype)
          ) {
            console.error(
              `${prefix}: multipliers.categories.${key}.travel_subtype must be one of ${Array.from(
                TRAVEL_SUBTYPES
              ).join(", ")} when present.`
            )
            failed = true
          }
        }
        if (config.booking_channel != null) {
          if (
            typeof config.booking_channel !== "string" ||
            !BOOKING_CHANNELS.has(config.booking_channel)
          ) {
            console.error(
              `${prefix}: multipliers.categories.${key}.booking_channel must be one of ${Array.from(
                BOOKING_CHANNELS
              ).join(", ")} when present.`
            )
            failed = true
          }
        }
        if (TRAVEL_TOKEN_RE.test(key)) {
          if (Object.prototype.hasOwnProperty.call(TRAVEL_KEY_ALIASES, key)) {
            console.error(
              `${prefix}: deprecated travel key "${key}". Use "${TRAVEL_KEY_ALIASES[key]}" instead.`
            )
            failed = true
          } else if (!CANONICAL_TRAVEL_KEYS.has(key)) {
            console.error(
              `${prefix}: non-canonical travel key "${key}". Allowed travel keys: ${Array.from(
                CANONICAL_TRAVEL_KEYS
              ).join(", ")}`
            )
            failed = true
          }
          if (PORTAL_ONLY_KEYS.has(key) && config.requires_portal !== true) {
            console.error(
              `${prefix}: ${key} must set requires_portal: true to make portal-only earn explicit.`
            )
            failed = true
          }
        }
        if (
          OTHER_LIKE_KEY_RE.test(key) &&
          !GENERAL_OTHER_KEYS.has(key) &&
          !GENERAL_OTHER_KEY_RE.test(key)
        ) {
          console.error(
            `${prefix}: non-general "other" key "${key}". Allowed generic other keys: ${Array.from(
              GENERAL_OTHER_KEYS
            ).join(", ")}`
          )
          failed = true
        }
      }
      const specificRule = CARD_SPECIFIC_TRAVEL_RULES[card.id]
      if (specificRule) {
        for (const requiredKey of specificRule.required) {
          if (!Object.prototype.hasOwnProperty.call(cats, requiredKey)) {
            console.error(`${prefix}: ${specificRule.message} Missing "${requiredKey}".`)
            failed = true
          }
        }
        for (const forbiddenKey of specificRule.forbidden) {
          if (Object.prototype.hasOwnProperty.call(cats, forbiddenKey)) {
            console.error(`${prefix}: ${specificRule.message} Remove "${forbiddenKey}".`)
            failed = true
          }
        }
      }
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
  if (card?.transfer_partners != null) {
    if (!Array.isArray(card.transfer_partners)) {
      console.error(`${prefix}: transfer_partners must be an array.`)
      failed = true
    } else {
      for (let i = 0; i < card.transfer_partners.length; i++) {
        const partner = card.transfer_partners[i]
        if (typeof partner !== "object" || partner == null) {
          console.error(`${prefix}: transfer_partners[${i}] must be an object.`)
          failed = true
          continue
        }
        if (typeof partner.name !== "string" || !partner.name.trim()) {
          console.error(`${prefix}: transfer_partners[${i}].name must be a non-empty string.`)
          failed = true
        }
        if (typeof partner.ratio !== "string" || !partner.ratio.trim()) {
          console.error(`${prefix}: transfer_partners[${i}].ratio must be a non-empty string.`)
          failed = true
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
  console.log("Validation passed: data/cards.json is structurally and semantically valid.")
}

main()
