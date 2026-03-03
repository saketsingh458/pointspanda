import type {
  Card,
  CardRaw,
  CategoryEarnRate,
  CategoryMultipliers,
  SpendCategoryId,
  StatementCredit,
} from "@/lib/types"
import cardCatalogJson from "@/data/cards.json"

/**
 * Human-readable labels for spend categories (for strategy table, etc.).
 */
export const CATEGORY_LABELS: Record<SpendCategoryId, string> = {
  travel: "Travel",
  dining: "Dining",
  groceries: "Groceries",
  gasEv: "Gas & EV",
  streamingEntertainment: "Streaming & Entertainment",
  drugstores: "Drugstores",
  rentMortgage: "Rent & Mortgage",
  other: "Other",
}

/**
 * Map raw multiplier category keys to our spend categories.
 * Used to build categoryMultipliers from multipliers.base_rate + multipliers.categories.
 */
const MULTIPLIER_CATEGORY_TO_SPEND: Record<string, SpendCategoryId> = {
  travel_portal_hotels_cars: "travel",
  travel_portal_flights: "travel",
  travel_portal: "travel",
  travel: "travel",
  flights_direct: "travel",
  hotels_direct: "travel",
  flights_direct_or_portal: "travel",
  hotels_prepaid_portal: "travel",
  flights_hotels_direct: "travel",
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
  rotating: "other",
  rotating_categories: "other",
  social_media_search_ads: "other",
  other: "other",
}

/** Humanize raw category key for channel label (e.g. "travel_portal" -> "Travel portal"). */
function channelLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function inferSpendCategoryFromKey(rawKey: string): SpendCategoryId {
  const key = rawKey.trim().toLowerCase()
  const explicit = MULTIPLIER_CATEGORY_TO_SPEND[key]
  if (explicit) return explicit

  if (
    /(travel|flight|airfare|airline|hotel|portal|rideshare|lyft|uber|rental|cruise)/.test(
      key
    )
  ) {
    return "travel"
  }
  if (/(dining|restaurant)/.test(key)) return "dining"
  if (/(grocery|supermarket)/.test(key)) return "groceries"
  if (/(gas|fuel|ev|transit)/.test(key)) return "gasEv"
  if (/(streaming|entertainment)/.test(key)) return "streamingEntertainment"
  if (/(drugstore|pharmacy)/.test(key)) return "drugstores"
  if (/(rent|mortgage)/.test(key)) return "rentMortgage"
  return "other"
}

function rawToCard(raw: CardRaw): Card {
  const base = raw.multipliers?.base_rate ?? 0
  const mults: CategoryMultipliers = {
    travel: base,
    dining: base,
    groceries: base,
    gasEv: base,
    streamingEntertainment: base,
    drugstores: base,
    rentMortgage: base,
    other: base,
  }
  const cats = raw.multipliers?.categories ?? {}
  const earnDetails: Partial<Record<SpendCategoryId, CategoryEarnRate[]>> = {}
  const caps: Partial<Record<SpendCategoryId, number>> = {}

  for (const [key, config] of Object.entries(cats)) {
    const spendCat = inferSpendCategoryFromKey(key)
    const rate = config.rate
    if (rate > (mults[spendCat] ?? 0)) mults[spendCat] = rate

    const channel = channelLabel(key)
    const rateEntry: CategoryEarnRate = {
      channel,
      multiplier: rate,
      ...(config.cap_amount != null && { capAmount: config.cap_amount }),
    }
    if (!earnDetails[spendCat]) earnDetails[spendCat] = []
    earnDetails[spendCat]!.push(rateEntry)
    if (config.cap_amount != null) {
      const existing = caps[spendCat] ?? 0
      if (config.cap_amount > existing) caps[spendCat] = config.cap_amount
    }
  }

  const statementCredits: StatementCredit[] | undefined =
    raw.statement_credits && raw.statement_credits.length > 0
      ? raw.statement_credits.map((sc) => ({
          name: sc.name,
          amount: sc.amount,
          deductsFromEligibleSpend: sc.deducts_from_eligible_spend,
          frequency: sc.frequency,
        }))
      : undefined

  const valuation = raw.valuation
  const cppFloor = valuation?.cpp_floor
  const cppCeiling = valuation?.cpp_ceiling

  return {
    id: raw.id,
    name: raw.name,
    issuer: raw.issuer,
    annualFee: raw.annual_fee,
    baseRate: base,
    categoryMultipliers: mults,
    categoryEarnDetails: Object.keys(earnDetails).length > 0 ? earnDetails : undefined,
    categoryCaps: Object.keys(caps).length > 0 ? caps : undefined,
    benefits: raw.ui_elements.benefits_list ?? [],
    benefitSummary: (raw.ui_elements.benefits_list ?? []).slice(0, 3),
    applyUrl: raw.ui_elements.apply_url,
    statementCredits,
    ...(raw.welcome_offer && {
      signUpBonus: raw.welcome_offer.points,
      signUpBonusSpendRequirement: raw.welcome_offer.spend_requirement,
      signUpBonusTimeframeMonths: raw.welcome_offer.timeframe_months,
    }),
    ...(cppFloor != null && {
      pointsValueBaseCents: Math.round(cppFloor * 100),
    }),
    ...(cppCeiling != null && {
      pointsValueMaxCents: Math.round(cppCeiling * 100),
    }),
    ...(raw.reward_currency && { rewardCurrency: raw.reward_currency }),
    ...(raw.synergy_ecosystem && { synergyEcosystem: raw.synergy_ecosystem }),
    ...(raw.developer_notes && { developerNotes: raw.developer_notes }),
    ...(raw.reward_currency && !raw.developer_notes && { pointsValueNote: raw.reward_currency }),
  }
}

/** Detect if a single item is in new schema (has ui_elements). */
function isRawCard(item: unknown): item is CardRaw {
  return (
    typeof item === "object" &&
    item !== null &&
    "ui_elements" in item &&
    typeof (item as CardRaw).ui_elements === "object"
  )
}

/**
 * Card catalog: reward structure and metadata. Loaded from data/cards.json
 * (single source of truth). Supports both new schema (snake_case, nested) and legacy (camelCase, flat).
 */
export const CARD_CATALOG: Card[] = (Array.isArray(cardCatalogJson)
  ? cardCatalogJson
  : []
).map((item) => (isRawCard(item) ? rawToCard(item) : (item as unknown as Card)))

export function getCardById(id: string): Card | undefined {
  return CARD_CATALOG.find((c) => c.id === id)
}

export function getCardsByIds(ids: string[]): Card[] {
  return ids
    .map(getCardById)
    .filter((c): c is Card => c !== undefined)
}

/** Search catalog by name (case-insensitive, partial match). */
export function searchCards(query: string): Card[] {
  const q = query.trim().toLowerCase()
  if (!q) return CARD_CATALOG
  return CARD_CATALOG.filter((c) => c.name.toLowerCase().includes(q))
}

/** Get all cards in the catalog that are co-branded with the given brand id. */
export function getCardsForBrand(brandId: string): Card[] {
  return CARD_CATALOG.filter(
    (c) => c.brandIds && c.brandIds.includes(brandId)
  )
}
