/**
 * Spend category IDs — must match intake sliders and card multipliers.
 */
export const SPEND_CATEGORIES = [
  "travel",
  "dining",
  "groceries",
  "gasEv",
  "streamingEntertainment",
  "drugstores",
  "rentMortgage",
  "other",
] as const

export type SpendCategoryId = (typeof SPEND_CATEGORIES)[number]

/** Monthly spend per category (USD). */
export type MonthlySpend = Record<SpendCategoryId, number>

/** Reward structure: points per $1 in each category (e.g. 3 = 3x). Used for strategy; use best rate when multiple exist. */
export type CategoryMultipliers = Record<SpendCategoryId, number>

export type CapPeriod = "monthly" | "quarterly" | "annual"
export type TravelSubtype = "flight" | "hotel" | "car" | "general"
export type EarnChannel = "portal" | "direct" | "either"

/** One earn rate within a category (e.g. "Chase Travel" 8x, "flights/hotels direct" 4x). */
export interface CategoryEarnRate {
  channel: string
  multiplier: number
  /** Optional cap in USD per period (e.g. 300 = first $300/mo). */
  capAmount?: number
  /** Optional period for capAmount. */
  capPeriod?: CapPeriod
  /** Original category key from cards.json multipliers.categories. */
  rawKey?: string
  /** Whether this earn rate requires booking via issuer portal. */
  requiresPortal?: boolean
  /** Optional travel subtype used for realistic weighting in strategy. */
  travelSubtype?: TravelSubtype
  /** Optional booking channel applicability for this earn rate. */
  bookingChannel?: EarnChannel
}

/** Optional breakdown of earn by channel when a category has multiple rates (e.g. 8x portal, 4x direct). */
export type CategoryEarnDetails = Partial<
  Record<SpendCategoryId, CategoryEarnRate[]>
>

/** Raw card from catalog JSON (snake_case, nested). Matches data/cards.schema.json. */
export type StatementCreditFrequency =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "semi_annual"
  | "one_time"
  | "per_instance"
  | `every_${number}_years`

export interface StatementCreditRaw {
  name: string
  amount: number
  deducts_from_eligible_spend: boolean
  frequency: StatementCreditFrequency
  restrictions?: string
}

export interface MultiplierCategoryRaw {
  rate: number
  requires_portal?: boolean
  cap_amount?: number
  cap_period?: CapPeriod
  travel_subtype?: TravelSubtype
  booking_channel?: EarnChannel
}

export interface TransferPartnerRaw {
  name: string
  ratio: string
}

export interface CardRaw {
  id: string
  name: string
  issuer: string
  synergy_ecosystem?: string
  annual_fee: number
  reward_currency: string
  developer_notes?: string
  anniversary_bonus?: string | null
  ui_elements: {
    image_url?: string
    apply_url?: string
    benefits_list?: string[]
  }
  valuation?: {
    cpp_nerdwallet?: number
    cpp_pointsguy?: number
    cpp_assumed?: number
    cpp_bankrate?: number
    cpp_creditkarma?: number
    cpp_floor?: number
    cpp_ceiling?: number
  }
  welcome_offer?: {
    points: number
    spend_requirement?: number
    timeframe_months?: number
  }
  statement_credits?: StatementCreditRaw[]
  transfer_partners?: TransferPartnerRaw[]
  multipliers?: {
    base_rate: number
    categories?: Record<string, MultiplierCategoryRaw>
  }
}

export interface Card {
  id: string
  name: string
  annualFee: number
  categoryMultipliers: CategoryMultipliers
  /** When present, use for display; strategy still uses categoryMultipliers (best rate). */
  categoryEarnDetails?: CategoryEarnDetails
  /** Full benefit list (detail view, strategy comparison). */
  benefits: string[]
  /** Short 3-line summary for wallet tile; use this for "Key benefits" on cards. */
  benefitSummary?: string[]
  /** Optional: sign-up bonus points (e.g. 60000). */
  signUpBonus?: number
  /** Optional: sign-up bonus spend requirement in USD (e.g. 4000). */
  signUpBonusSpendRequirement?: number
  /** Optional: sign-up bonus timeframe in months (e.g. 3). */
  signUpBonusTimeframeMonths?: number
  /** Optional anniversary/member bonus text (e.g. "10000 miles"). */
  anniversaryBonus?: string
  /** Optional: apply URL for "Apply Now". */
  applyUrl?: string
  /** Optional: brand ids this card is co-branded with (e.g. "united", "delta"). */
  brandIds?: string[]
  /** Issuer name (e.g. "Chase", "Amex"). */
  issuer?: string
  /** URL or path to card art (see plan §2.4). */
  imageUrl?: string
  /** NerdWallet valuation in cents per point (e.g. 180 = 1.8 cpp). */
  pointsValueNerdWalletCents?: number
  /** The Points Guy valuation in cents per point (e.g. 205 = 2.05 cpp). */
  pointsValuePointsGuyCents?: number
  /** Bankrate valuation in cents per point (e.g. 200 = 2.0 cpp). */
  pointsValueBankrateCents?: number
  /** Credit Karma valuation in cents per point (e.g. 171 = 1.71 cpp). */
  pointsValueCreditKarmaCents?: number
  /** Assumed valuation for strategy ranking (e.g. 125 = 1.25 cpp). */
  pointsValueAssumedCents?: number
  /** @deprecated Use pointsValueAssumedCents. Legacy baseline cents per point. */
  pointsValueBaseCents?: number
  /** @deprecated Use pointsValueNerdWalletCents/pointsValuePointsGuyCents. Legacy high-value cpp. */
  pointsValueMaxCents?: number
  /** Note for points valuation (e.g. "Max with Chase Travel redemptions"). */
  pointsValueNote?: string
  /** Reward currency label (e.g. "Ultimate Rewards"). */
  rewardCurrency?: string
  /** Ecosystem label (e.g. "Chase UR"). */
  synergyEcosystem?: string
  /** Optional issuer note copied from source data. */
  developerNotes?: string
  /** Optional benefit grouping for UI (e.g. ["Travel", "Lounge"]). */
  benefitCategories?: string[]
  /** ISO date when card was last updated. */
  lastUpdatedAt?: string
  /** Primary URL (issuer page) for this card. */
  sourceUrl?: string
  /** Statement credits (annual, etc.) for detail view and summary. */
  statementCredits?: StatementCredit[]
  /** Transfer partners and published conversion ratios (e.g. 1:1). */
  transferPartners?: TransferPartner[]
  /** Per-category earn caps in USD (e.g. first $300/mo) for summary display. */
  categoryCaps?: Partial<Record<SpendCategoryId, number>>
  /** Base earn rate (e.g. 1x); "Other" category always uses this. */
  baseRate?: number
}

/** Statement credit (camelCase) for UI. */
export interface StatementCredit {
  name: string
  amount: number
  deductsFromEligibleSpend: boolean
  frequency: StatementCreditFrequency
  restrictions?: string
}

export interface TransferPartner {
  name: string
  ratio: string
}

/** User's wallet: list of card IDs (from catalog). */
export type WalletCardIds = string[]

/** Brand loyalty: brand id -> monthly spend (USD). */
export type BrandSpends = Record<string, number>

/** Per-category strategy row for the table. */
export interface CategoryStrategyRow {
  categoryId: SpendCategoryId
  categoryLabel: string
  currentBestCard: Card | null
  currentMultiplier: number
  suggestedCard: Card | null
  suggestedMultiplier: number
  incrementalAnnualPoints: number
  incrementalAnnualDollars: number
  isOptimized: boolean
}

/** Structured strategy assumption shown in the strategy UI. */
export interface StrategyAssumption {
  id: string
  title: string
  assumption: string
  whyItMatters?: string
  sourceLabel?: string
}

/** Structured strategy limitation shown in the strategy UI. */
export interface StrategyLimitation {
  id: string
  title: string
  limitation: string
  whyItMatters?: string
}

export type StrategyViewId = "nextBestCard" | "bestSingleCard" | "bestEcosystem"

/** Summary of a recommended portfolio, including multi-card ecosystem setups. */
export interface StrategyPortfolioSummary {
  cards: Card[]
  annualPoints: number
  annualDollars: number
  annualFee: number
  netAnnualValue: number
  benefitLabels: string[]
}

/** Ranked ecosystem option shown in the ecosystem tab. */
export interface EcosystemStrategyOption {
  ecosystemId: string
  ecosystemLabel: string
  portfolio: StrategyPortfolioSummary
  categoryRows: CategoryStrategyRow[]
  summaryReason: string
}

/** Full computed strategy result for the strategy page. */
export interface StrategyResult {
  viewId: StrategyViewId
  currentAnnualPoints: number
  currentAnnualDollars: number
  currentAnnualFee: number
  currentBenefitLabels: string[]
  maxPotentialAnnualPoints: number
  maxPotentialAnnualDollars: number
  /** Incremental value attributable to adding the single recommended card. */
  incrementalAnnualPoints: number
  /** Incremental value attributable to adding the single recommended card. */
  incrementalAnnualDollars: number
  netAdditionalFee: number
  additionalBenefitLabels: string[]
  categoryRows: CategoryStrategyRow[]
  recommendedCard: Card | null
  recommendedCards: Card[]
  recommendedPortfolio?: StrategyPortfolioSummary
  ecosystemId?: string
  ecosystemLabel?: string
  alternativeOptions?: EcosystemStrategyOption[]
  summaryReason: string
  /** Estimated dollar value of current points at display cpp (e.g. 1.25 cpp). */
  estimatedValueCurrentDollars?: number
  /** Estimated dollar value of max potential points at display cpp. */
  estimatedValueMaxDollars?: number
  /** Cents per point used for estimated value display (e.g. 125 = 1.25 cpp). */
  displayCppCents?: number
  /** CPP sources for display: NerdWallet, TPG, Bankrate, Credit Karma, assumed. */
  displayCppSources?: {
    nerdwallet?: number
    pointsguy?: number
    bankrate?: number
    creditkarma?: number
    assumed?: number
  }
  /** Explicit assumptions applied in strategy math and shown as footnotes in UI. */
  strategyAssumptions: StrategyAssumption[]
  /** Known model limitations shown as plain-language caveats in UI. */
  strategyLimitations: StrategyLimitation[]
}

/** Aggregate strategy payload for the strategy page tabs. */
export interface StrategyPageData {
  nextBestCard: StrategyResult
  bestSingleCard: StrategyResult
  bestEcosystem: StrategyResult
}
