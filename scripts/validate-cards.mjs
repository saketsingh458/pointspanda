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
const CREDIT_FREQUENCIES = new Set([
  "monthly",
  "quarterly",
  "yearly",
  "semi_annual",
  "one_time",
  "per_instance",
])
const EVERY_YEARS_RE = /^every_([1-9]\d*)_years$/

const MULTIPLIER_CATEGORY_TO_SPEND = {
  travel_portal_hotels_cars: "travel",
  travel_portal_flights: "travel",
  travel_portal: "travel",
  travel: "travel",
  flights_direct: "travel",
  hotels_direct: "travel",
  flights_direct_or_portal: "travel",
  hotels_prepaid_portal: "travel",
  travel_general: "travel",
  flights_hotels_direct: "travel",
  flights: "travel",
  hotels_prepaid: "travel",
  hotels_vacation_rentals_rental_cars_portal: "travel",
  "2x_airfare": "travel",
  rental_cars: "travel",
  travel_shipping_advertising_internet_cable_phone: "travel",
  dining: "dining",
  groceries: "groceries",
  gas: "gasEv",
  gas_ev_transit: "gasEv",
  streaming: "streamingEntertainment",
  entertainment: "streamingEntertainment",
  us_streaming: "streamingEntertainment",
  popular_streaming: "streamingEntertainment",
  drugstores: "drugstores",
  rent_mortgage: "rentMortgage",
  "1x_rent_and_mortgage": "rentMortgage",
  "1x125x_rent_and_mortgage": "rentMortgage",
  other: "other",
}

const MULTIPLIER_CATEGORY_KEY_ALIASES = {
  flights_robinhood_portal: "travel_portal_flights",
  hotels_rental_cars_robinhood_portal: "travel_portal_hotels_cars",
  lyft: "travel",
}

const DINING_TOKEN_RE = /(^|_)(dining|restaurant)(_|$)/
const GROCERY_TOKEN_RE = /(^|_)(grocery|groceries|supermarket|supermarkets)(_|$)/
const GAS_EV_TOKEN_RE = /(^|_)(gas|fuel|ev|transit)(_|$)/
const STREAMING_TOKEN_RE = /(^|_)(streaming|entertainment)(_|$)/
const DRUGSTORE_TOKEN_RE = /(^|_)(drugstore|drugstores|pharmacy|pharmacies)(_|$)/
const RENT_TOKEN_RE = /(^|_)(rent|mortgage)(_|$)/

const CARD_SPECIFIC_TRAVEL_RULES = {
  "citi-strata-elite-card": {
    required: ["travel_portal_hotels_cars", "travel_portal_flights"],
    forbidden: ["travel_portal"],
    message:
      "must split portal travel into travel_portal_hotels_cars and travel_portal_flights to avoid overstating portal flight earn.",
  },
}

const REQUIRED_ANNIVERSARY_BONUSES = {
  "chase-sapphire-preferred-card": {
    pattern: /10%\s+total spend points boost/i,
    description: 'the published "10% total spend points boost" anniversary bonus',
  },
  "sapphire-reserve-for-business": {
    pattern: /IHG One Rewards Diamond Elite status.*Southwest A-List status/i,
    description:
      'the published anniversary bonus covering IHG One Rewards Diamond Elite status and Southwest A-List status',
  },
  "capital-one-venture-x-rewards-credit-card": {
    pattern: /10000\s+miles/i,
    description: 'the published "10000 miles" anniversary bonus',
  },
  "venture-x-business": {
    pattern: /10000\s+miles/i,
    description: 'the published "10000 miles" anniversary bonus',
  },
}

function normalizeMultiplierCategoryKey(rawKey) {
  const key = String(rawKey).trim().toLowerCase()
  return MULTIPLIER_CATEGORY_KEY_ALIASES[key] ?? key
}

function inferSpendCategoryFromKey(rawKey) {
  const key = normalizeMultiplierCategoryKey(rawKey)
  if (GENERAL_OTHER_KEYS.has(key) || GENERAL_OTHER_KEY_RE.test(key)) return "other"
  if (MULTIPLIER_CATEGORY_TO_SPEND[key]) return MULTIPLIER_CATEGORY_TO_SPEND[key]
  if (TRAVEL_TOKEN_RE.test(key)) return null
  if (DINING_TOKEN_RE.test(key)) return "dining"
  if (GROCERY_TOKEN_RE.test(key)) return "groceries"
  if (GAS_EV_TOKEN_RE.test(key)) return "gasEv"
  if (STREAMING_TOKEN_RE.test(key)) return "streamingEntertainment"
  if (DRUGSTORE_TOKEN_RE.test(key)) return "drugstores"
  if (RENT_TOKEN_RE.test(key)) return "rentMortgage"
  return null
}

function recordAudit(auditMap, cardId, value) {
  const id = cardId || "unknown-card-id"
  if (!auditMap.has(id)) auditMap.set(id, new Set())
  auditMap.get(id).add(value)
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

function validateNew(card, index, audit) {
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
  if (
    card?.anniversary_bonus != null &&
    (typeof card.anniversary_bonus !== "string" || !card.anniversary_bonus.trim())
  ) {
    console.error(`${prefix}: anniversary_bonus must be a non-empty string when present.`)
    failed = true
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
        const normalizedKey = normalizeMultiplierCategoryKey(key)
        const inferredSpendCategory = inferSpendCategoryFromKey(key)
        if (normalizedKey !== String(key).trim().toLowerCase()) {
          console.warn(
            `${prefix}: multiplier key "${key}" is recognized as alias "${normalizedKey}". Prefer canonical key in data.`
          )
          recordAudit(audit.aliasesByCard, card?.id, `${key} -> ${normalizedKey}`)
        }
        if (inferredSpendCategory == null) {
          console.warn(
            `${prefix}: unmapped multiplier key "${key}". It may be ignored by parsing logic without an explicit mapping or supported pattern.`
          )
          recordAudit(audit.unmappedKeysByCard, card?.id, key)
        }
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
            console.warn(
              `${prefix}: deprecated travel key "${key}". Use "${TRAVEL_KEY_ALIASES[key]}" instead.`
            )
            recordAudit(audit.nonCanonicalTravelKeysByCard, card?.id, `${key} -> ${TRAVEL_KEY_ALIASES[key]}`)
          } else if (!CANONICAL_TRAVEL_KEYS.has(normalizedKey)) {
            console.warn(
              `${prefix}: non-canonical travel key "${key}". Allowed travel keys: ${Array.from(
                CANONICAL_TRAVEL_KEYS
              ).join(", ")}`
            )
            recordAudit(audit.nonCanonicalTravelKeysByCard, card?.id, key)
          }
          if (PORTAL_ONLY_KEYS.has(normalizedKey) && config.requires_portal !== true) {
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
          console.warn(
            `${prefix}: non-general "other" key "${key}". Allowed generic other keys: ${Array.from(
              GENERAL_OTHER_KEYS
            ).join(", ")}`
          )
          recordAudit(audit.unmappedKeysByCard, card?.id, key)
        }
      }
      const specificRule = CARD_SPECIFIC_TRAVEL_RULES[card.id]
      if (specificRule) {
        const normalizedCatKeys = new Set(
          Object.keys(cats).map((categoryKey) => normalizeMultiplierCategoryKey(categoryKey))
        )
        for (const requiredKey of specificRule.required) {
          if (!normalizedCatKeys.has(requiredKey)) {
            console.error(`${prefix}: ${specificRule.message} Missing "${requiredKey}".`)
            failed = true
          }
        }
        for (const forbiddenKey of specificRule.forbidden) {
          if (normalizedCatKeys.has(forbiddenKey)) {
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
  if (card?.valuation != null) {
    if (typeof card.valuation !== "object") {
      console.error(`${prefix}: valuation must be an object.`)
      failed = true
    } else {
      const v = card.valuation
      const allowed = ["cpp_nerdwallet", "cpp_pointsguy", "cpp_assumed", "cpp_bankrate", "cpp_creditkarma"]
      for (const key of Object.keys(v)) {
        if (!allowed.includes(key)) {
          console.error(`${prefix}: valuation.${key} is invalid. Use cpp_nerdwallet, cpp_pointsguy, cpp_assumed.`)
          failed = true
        }
        if (typeof v[key] !== "number" || !Number.isFinite(v[key])) {
          console.error(`${prefix}: valuation.${key} must be a finite number.`)
          failed = true
        }
      }
    }
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
        if (typeof sc.name !== "string" || !sc.name.trim()) {
          console.error(`${prefix}: statement_credits[${i}].name must be a non-empty string.`)
          failed = true
        }
        if (typeof sc.amount !== "number" || !Number.isFinite(sc.amount) || sc.amount <= 0) {
          console.error(`${prefix}: statement_credits[${i}].amount must be a positive number.`)
          failed = true
        }
        if (typeof sc.deducts_from_eligible_spend !== "boolean") {
          console.error(
            `${prefix}: statement_credits[${i}].deducts_from_eligible_spend must be boolean.`
          )
          failed = true
        }
        if (typeof sc.frequency !== "string") {
          console.error(`${prefix}: statement_credits[${i}].frequency must be a string.`)
          failed = true
        } else {
          const freq = sc.frequency.trim()
          if (!CREDIT_FREQUENCIES.has(freq) && !EVERY_YEARS_RE.test(freq)) {
            console.error(
              `${prefix}: statement_credits[${i}].frequency "${freq}" is invalid. Use one of ${Array.from(
                CREDIT_FREQUENCIES
              ).join(", ")} or every_<n>_years.`
            )
            failed = true
          }
        }
        if (sc.restrictions != null && typeof sc.restrictions !== "string") {
          console.error(`${prefix}: statement_credits[${i}].restrictions must be a string when present.`)
          failed = true
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
  const validEligibility = new Set(["direct", "pooling_only", "none"])
  if (card?.points_transfer_eligibility != null) {
    if (!validEligibility.has(card.points_transfer_eligibility)) {
      console.error(
        `${prefix}: points_transfer_eligibility must be one of: direct, pooling_only, none. Got: ${card.points_transfer_eligibility}`
      )
      failed = true
    }
    if (card.points_transfer_eligibility === "pooling_only" && (card.transfer_eligibility_note == null || typeof card.transfer_eligibility_note !== "string" || !card.transfer_eligibility_note.trim())) {
      console.error(`${prefix}: transfer_eligibility_note is recommended when points_transfer_eligibility is pooling_only.`)
    }
  }
  if (card?.transfer_eligibility_note != null && card?.points_transfer_eligibility !== "pooling_only") {
    console.error(`${prefix}: transfer_eligibility_note should only be set when points_transfer_eligibility is pooling_only.`)
    failed = true
  }
  const expectedAnniversaryBonus = REQUIRED_ANNIVERSARY_BONUSES[card?.id]
  if (expectedAnniversaryBonus) {
    const bonus = typeof card?.anniversary_bonus === "string" ? card.anniversary_bonus.trim() : ""
    if (!expectedAnniversaryBonus.pattern.test(bonus)) {
      console.error(
        `${prefix}: anniversary_bonus must include ${expectedAnniversaryBonus.description}.`
      )
      failed = true
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
  const audit = {
    aliasesByCard: new Map(),
    unmappedKeysByCard: new Map(),
    nonCanonicalTravelKeysByCard: new Map(),
  }

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
      failed = validateNew(card, i, audit) || failed
    } else {
      failed = validateLegacy(card, i) || failed
    }
  }

  const printAuditSection = (title, entries) => {
    if (entries.size === 0) return
    console.warn(`\n[validate:cards] ${title}`)
    for (const [cardId, values] of [...entries.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      console.warn(`- ${cardId}: ${[...values].sort().join(", ")}`)
    }
  }

  printAuditSection("Aliased multiplier keys detected", audit.aliasesByCard)
  printAuditSection("Unmapped multiplier keys detected", audit.unmappedKeysByCard)
  printAuditSection("Non-canonical travel keys detected", audit.nonCanonicalTravelKeysByCard)

  if (failed) process.exit(1)
  console.log("Validation passed: data/cards.json is structurally and semantically valid.")
}

main()
