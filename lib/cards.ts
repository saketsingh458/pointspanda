import type {
  CapPeriod,
  Card,
  CardRaw,
  CategoryEarnRate,
  CategoryMultipliers,
  EarnChannel,
  SpendCategoryId,
  StatementCredit,
  TransferPartner,
  TravelSubtype,
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

/**
 * Normalize issuer-specific or legacy key aliases to canonical keys before parsing.
 * This avoids silent 1x fallback when new cards introduce equivalent naming.
 */
const MULTIPLIER_CATEGORY_KEY_ALIASES: Record<string, string> = {
  flights_robinhood_portal: "travel_portal_flights",
  hotels_rental_cars_robinhood_portal: "travel_portal_hotels_cars",
  lyft: "travel",
}

const GENERAL_OTHER_KEYS = new Set(["other", "1_all_other", "all_purchases"])
const GENERAL_OTHER_KEY_RE = /^[0-9]+x_on_all_purchases$/

const CONTAINS_TRAVEL_TOKEN_RE = /(travel|flight|airfare|airline|hotel|portal|rideshare|lyft|uber|rental|cruise)/
const DINING_TOKEN_RE = /(^|_)(dining|restaurant)(_|$)/
const GROCERY_TOKEN_RE = /(^|_)(grocery|groceries|supermarket|supermarkets)(_|$)/
const GAS_EV_TOKEN_RE = /(^|_)(gas|fuel|ev|transit)(_|$)/
const STREAMING_TOKEN_RE = /(^|_)(streaming|entertainment)(_|$)/
const DRUGSTORE_TOKEN_RE = /(^|_)(drugstore|drugstores|pharmacy|pharmacies)(_|$)/
const RENT_TOKEN_RE = /(^|_)(rent|mortgage)(_|$)/

/** Humanize raw category key for channel label (e.g. "travel_portal" -> "Travel portal"). */
function channelLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function normalizeMultiplierCategoryKey(rawKey: string): string {
  const key = rawKey.trim().toLowerCase()
  return MULTIPLIER_CATEGORY_KEY_ALIASES[key] ?? key
}

function inferSpendCategoryFromKey(rawKey: string): SpendCategoryId | null {
  const key = normalizeMultiplierCategoryKey(rawKey)
  if (GENERAL_OTHER_KEYS.has(key) || GENERAL_OTHER_KEY_RE.test(key)) return "other"

  const explicit = MULTIPLIER_CATEGORY_TO_SPEND[key]
  if (explicit) return explicit

  // Travel-like keys must use canonical travel keys; do not inflate generic "other".
  if (CONTAINS_TRAVEL_TOKEN_RE.test(key)) return null
  if (DINING_TOKEN_RE.test(key)) return "dining"
  if (GROCERY_TOKEN_RE.test(key)) return "groceries"
  if (GAS_EV_TOKEN_RE.test(key)) return "gasEv"
  if (STREAMING_TOKEN_RE.test(key)) return "streamingEntertainment"
  if (DRUGSTORE_TOKEN_RE.test(key)) return "drugstores"
  if (RENT_TOKEN_RE.test(key)) return "rentMortgage"
  return null
}

function inferBookingChannelFromKey(rawKey: string): EarnChannel {
  const key = normalizeMultiplierCategoryKey(rawKey)
  if (key.includes("direct_or_portal")) return "either"
  if (key.includes("portal")) return "portal"
  if (key.includes("direct")) return "direct"
  return "either"
}

function inferTravelSubtypeFromKey(rawKey: string): TravelSubtype {
  const key = normalizeMultiplierCategoryKey(rawKey)
  if (key.includes("flight") || key.includes("airfare")) return "flight"
  if (key.includes("hotel")) return "hotel"
  if (key.includes("rental_cars") || key.includes("car")) return "car"
  return "general"
}

function normalizeCapPeriod(period?: CapPeriod): CapPeriod | undefined {
  if (!period) return undefined
  if (period === "monthly" || period === "quarterly" || period === "annual") return period
  return undefined
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
    const normalizedKey = normalizeMultiplierCategoryKey(key)
    const spendCat = inferSpendCategoryFromKey(key)
    if (!spendCat) continue
    const rate = config.rate
    if (rate > (mults[spendCat] ?? 0)) mults[spendCat] = rate

    const channel = channelLabel(normalizedKey)
    const capPeriod = normalizeCapPeriod(config.cap_period)
    const rateEntry: CategoryEarnRate = {
      channel,
      multiplier: rate,
      ...(config.cap_amount != null && { capAmount: config.cap_amount }),
      ...(capPeriod && { capPeriod }),
      rawKey: key,
      ...(config.requires_portal != null && { requiresPortal: config.requires_portal }),
      bookingChannel: config.booking_channel ?? inferBookingChannelFromKey(key),
      ...(spendCat === "travel" && {
        travelSubtype: config.travel_subtype ?? inferTravelSubtypeFromKey(key),
      }),
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
          ...(sc.restrictions ? { restrictions: sc.restrictions } : {}),
        }))
      : undefined
  const transferPartners: TransferPartner[] | undefined =
    raw.transfer_partners && raw.transfer_partners.length > 0
      ? raw.transfer_partners.map((partner) => ({
          name: partner.name,
          ratio: partner.ratio,
        }))
      : undefined

  const valuation = raw.valuation
  const cppNerdWallet = valuation?.cpp_nerdwallet
  const cppPointsGuy = valuation?.cpp_pointsguy
  const cppBankrate = valuation?.cpp_bankrate
  const cppCreditKarma = valuation?.cpp_creditkarma
  const cppAssumed = valuation?.cpp_assumed

  return {
    id: raw.id,
    name: raw.name,
    issuer: raw.issuer,
    ...(raw.card_type && { cardType: raw.card_type }),
    annualFee: raw.annual_fee,
    baseRate: base,
    categoryMultipliers: mults,
    categoryEarnDetails: Object.keys(earnDetails).length > 0 ? earnDetails : undefined,
    categoryCaps: Object.keys(caps).length > 0 ? caps : undefined,
    benefits: raw.ui_elements.benefits_list ?? [],
    benefitSummary: (raw.ui_elements.benefits_list ?? []).slice(0, 3),
    applyUrl: raw.ui_elements.apply_url,
    imageUrl: raw.ui_elements.image_url ?? undefined,
    statementCredits,
    transferPartners,
    ...(raw.points_transfer_eligibility && {
      pointsTransferEligibility: raw.points_transfer_eligibility,
    }),
    ...(raw.transfer_eligibility_note && {
      transferEligibilityNote: raw.transfer_eligibility_note,
    }),
    ...(raw.welcome_offer && {
      signUpBonus: raw.welcome_offer.points,
      signUpBonusSpendRequirement: raw.welcome_offer.spend_requirement,
      signUpBonusTimeframeMonths: raw.welcome_offer.timeframe_months,
    }),
    ...(raw.anniversary_bonus && { anniversaryBonus: raw.anniversary_bonus }),
    ...(cppNerdWallet != null && {
      pointsValueNerdWalletCents: Math.round(cppNerdWallet * 100),
    }),
    ...(cppPointsGuy != null && {
      pointsValuePointsGuyCents: Math.round(cppPointsGuy * 100),
    }),
    ...(cppBankrate != null && {
      pointsValueBankrateCents: Math.round(cppBankrate * 100),
    }),
    ...(cppCreditKarma != null && {
      pointsValueCreditKarmaCents: Math.round(cppCreditKarma * 100),
    }),
    ...(cppAssumed != null && {
      pointsValueAssumedCents: Math.round(cppAssumed * 100),
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

const DEFAULT_CPP_CENTS = 125

/**
 * CPP (cents per point) used for strategy ranking and display.
 * Uses assumed only; 0 is normalized to 1.00 cpp (100 cents).
 */
export function getCardRankingCppCents(card: Card): number {
  const raw =
    card.pointsValueAssumedCents ??
    card.pointsValueBaseCents ??
    DEFAULT_CPP_CENTS
  return raw === 0 ? 100 : raw
}

/**
 * CPP sources for display (NerdWallet, TPG, Bankrate, Credit Karma, assumed), in cents. Excludes null/undefined.
 */
export function getCardCppSources(card: Card): {
  nerdwallet?: number
  pointsguy?: number
  bankrate?: number
  creditkarma?: number
  assumed?: number
} {
  const out: {
    nerdwallet?: number
    pointsguy?: number
    bankrate?: number
    creditkarma?: number
    assumed?: number
  } = {}
  if (card.pointsValueNerdWalletCents != null) out.nerdwallet = card.pointsValueNerdWalletCents
  if (card.pointsValuePointsGuyCents != null) out.pointsguy = card.pointsValuePointsGuyCents
  if (card.pointsValueBankrateCents != null) out.bankrate = card.pointsValueBankrateCents
  if (card.pointsValueCreditKarmaCents != null) out.creditkarma = card.pointsValueCreditKarmaCents
  if (card.pointsValueAssumedCents != null) out.assumed = card.pointsValueAssumedCents
  return out
}
