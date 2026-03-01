/**
 * Spend category IDs — must match intake sliders and card multipliers.
 */
export const SPEND_CATEGORIES = [
  "travel",
  "dining",
  "groceries",
  "gas",
  "other",
] as const

export type SpendCategoryId = (typeof SPEND_CATEGORIES)[number]

/** Monthly spend per category (USD). */
export type MonthlySpend = Record<SpendCategoryId, number>

/** Reward structure: points per $1 in each category (e.g. 3 = 3x). */
export type CategoryMultipliers = Record<SpendCategoryId, number>

export interface Card {
  id: string
  name: string
  annualFee: number
  categoryMultipliers: CategoryMultipliers
  benefits: string[]
  /** Optional: sign-up bonus points (e.g. 60000). */
  signUpBonus?: number
  /** Optional: apply URL for "Apply Now". */
  applyUrl?: string
  /** Optional: brand ids this card is co-branded with (e.g. "united", "delta"). */
  brandIds?: string[]
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
  isOptimized: boolean
}

/** Full computed strategy result for the strategy page. */
export interface StrategyResult {
  currentAnnualPoints: number
  currentAnnualFee: number
  currentBenefitLabels: string[]
  maxPotentialAnnualPoints: number
  incrementalAnnualPoints: number
  netAdditionalFee: number
  additionalBenefitLabels: string[]
  categoryRows: CategoryStrategyRow[]
  recommendedCard: Card | null
  summaryReason: string
}
