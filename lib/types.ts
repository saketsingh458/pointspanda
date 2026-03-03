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

/** One earn rate within a category (e.g. "Chase Travel" 8x, "flights/hotels direct" 4x). */
export interface CategoryEarnRate {
  channel: string
  multiplier: number
  /** Optional cap in USD per period (e.g. 300 = first $300/mo). */
  capAmount?: number
}

/** Optional breakdown of earn by channel when a category has multiple rates (e.g. 8x portal, 4x direct). */
export type CategoryEarnDetails = Partial<
  Record<SpendCategoryId, CategoryEarnRate[]>
>

/** Raw card from catalog JSON (snake_case, nested). Matches data/cards.schema.json. */
export interface StatementCreditRaw {
  name: string
  amount: number
  deducts_from_eligible_spend: boolean
  frequency: string
}

export interface MultiplierCategoryRaw {
  rate: number
  requires_portal?: boolean
  cap_amount?: number
}

export interface CardRaw {
  id: string
  name: string
  issuer: string
  synergy_ecosystem?: string
  annual_fee: number
  reward_currency: string
  developer_notes?: string
  ui_elements: {
    image_url?: string
    apply_url?: string
    benefits_list?: string[]
  }
  valuation?: {
    cpp_floor?: number
    cpp_ceiling?: number
  }
  welcome_offer?: {
    points: number
    spend_requirement?: number
    timeframe_months?: number
  }
  statement_credits?: StatementCreditRaw[]
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
  /** Optional: apply URL for "Apply Now". */
  applyUrl?: string
  /** Optional: brand ids this card is co-branded with (e.g. "united", "delta"). */
  brandIds?: string[]
  /** Issuer name (e.g. "Chase", "Amex"). */
  issuer?: string
  /** URL or path to card art (see plan §2.4). */
  imageUrl?: string
  /** Baseline cents per point (e.g. 125 = 1.25 cpp). */
  pointsValueBaseCents?: number
  /** High-value redemption cpp (e.g. 200 = 2.0 cpp). */
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
  frequency: string
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

/** Full computed strategy result for the strategy page. */
export interface StrategyResult {
  currentAnnualPoints: number
  currentAnnualDollars: number
  currentAnnualFee: number
  currentBenefitLabels: string[]
  maxPotentialAnnualPoints: number
  maxPotentialAnnualDollars: number
  incrementalAnnualPoints: number
  incrementalAnnualDollars: number
  netAdditionalFee: number
  additionalBenefitLabels: string[]
  categoryRows: CategoryStrategyRow[]
  recommendedCard: Card | null
  summaryReason: string
  /** Estimated dollar value of current points at display cpp (e.g. 1.25 cpp). */
  estimatedValueCurrentDollars?: number
  /** Estimated dollar value of max potential points at display cpp. */
  estimatedValueMaxDollars?: number
  /** Cents per point used for estimated value display (e.g. 125 = 1.25 cpp). */
  displayCppCents?: number
  /** Explicit assumptions applied in strategy math and shown as footnotes in UI. */
  strategyAssumptions: string[]
}
