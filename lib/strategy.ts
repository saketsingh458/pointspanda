import type {
  Card,
  MonthlySpend,
  StrategyResult,
  CategoryStrategyRow,
  SpendCategoryId,
} from "@/lib/types"
import { SPEND_CATEGORIES } from "@/lib/types"
import { CARD_CATALOG, CATEGORY_LABELS, getCardById } from "@/lib/cards"

const MONTHS_PER_YEAR = 12
const DEFAULT_CPP_CENTS = 125
const SUBCATEGORY_SPEND_ASSUMPTIONS: Partial<
  Record<SpendCategoryId, { boostedShare: number; note: string }>
> = {
  travel: {
    boostedShare: 0.6,
    note:
      "Travel assumption: 60% of spend qualifies for high-earn channels (portal/partner/direct bonus buckets), 40% earns at base rate.",
  },
}

function getCardCppCents(card: Card): number {
  return card.pointsValueBaseCents ?? DEFAULT_CPP_CENTS
}

/**
 * pointsValueBaseCents stores cpp in hundredths (e.g. 125 => 1.25 cpp).
 * Dollars = points * cpp(cents/point) / 100(cents per dollar).
 */
function pointsToDollars(points: number, cppCents: number): number {
  return (points * cppCents) / 10000
}

function getBoostedSpendShare(categoryId: SpendCategoryId): number {
  return SUBCATEGORY_SPEND_ASSUMPTIONS[categoryId]?.boostedShare ?? 1
}

/**
 * Compute annual points for one card/category, respecting optional monthly caps.
 */
function getAnnualPointsForCardCategory(
  card: Card,
  categoryId: SpendCategoryId,
  monthlySpendAmount: number
): number {
  const monthly = Math.max(0, monthlySpendAmount)
  const categoryMultiplier = card.categoryMultipliers[categoryId] ?? 0
  const baseRate = card.baseRate ?? 0
  const monthlyCap = card.categoryCaps?.[categoryId]
  const boostedShare = getBoostedSpendShare(categoryId)
  const bonusEligibleMonthlySpend = monthly * boostedShare

  if (monthlyCap == null || monthlyCap <= 0) {
    return (
      (bonusEligibleMonthlySpend * categoryMultiplier +
        (monthly - bonusEligibleMonthlySpend) * baseRate) *
      MONTHS_PER_YEAR
    )
  }

  const boostedMonthlySpend = Math.min(bonusEligibleMonthlySpend, monthlyCap)
  const uncappedMonthlySpend = Math.max(0, monthly - boostedMonthlySpend)
  return (
    (boostedMonthlySpend * categoryMultiplier + uncappedMonthlySpend * baseRate) *
    MONTHS_PER_YEAR
  )
}

/**
 * Find the card in the set with best annual dollar earn for a category.
 * Ties: first one wins.
 */
function getBestCardForCategoryByDollars(
  cards: Card[],
  categoryId: SpendCategoryId,
  monthlySpendAmount: number
): { card: Card; multiplier: number; annualPoints: number; annualDollars: number } | null {
  if (cards.length === 0) return null
  let best: Card | null = null
  let bestAnnualPoints = 0
  let bestAnnualDollars = 0

  for (const c of cards) {
    const annualPoints = getAnnualPointsForCardCategory(c, categoryId, monthlySpendAmount)
    const annualDollars = pointsToDollars(annualPoints, getCardCppCents(c))
    if (annualDollars > bestAnnualDollars) {
      best = c
      bestAnnualPoints = annualPoints
      bestAnnualDollars = annualDollars
    }
  }

  return best
    ? {
        card: best,
        multiplier: best.categoryMultipliers[categoryId] ?? 0,
        annualPoints: bestAnnualPoints,
        annualDollars: bestAnnualDollars,
      }
    : null
}

/**
 * Current annual points: for each category, use best multiplier from wallet × monthly spend × 12.
 */
export function calculateCurrentAnnualPoints(
  monthlySpend: MonthlySpend,
  walletCards: Card[]
): number {
  if (walletCards.length === 0) return 0
  let total = 0
  for (const cat of SPEND_CATEGORIES) {
    const monthly = monthlySpend[cat] ?? 0
    const best = getBestCardForCategoryByDollars(walletCards, cat, monthly)
    total += best?.annualPoints ?? 0
  }
  return Math.round(total)
}

function calculateCurrentAnnualDollars(monthlySpend: MonthlySpend, walletCards: Card[]): number {
  if (walletCards.length === 0) return 0
  let total = 0
  for (const cat of SPEND_CATEGORIES) {
    const monthly = monthlySpend[cat] ?? 0
    const best = getBestCardForCategoryByDollars(walletCards, cat, monthly)
    total += best?.annualDollars ?? 0
  }
  return Math.round(total)
}

/**
 * Current total annual fee from wallet cards.
 */
export function getCurrentAnnualFee(walletCards: Card[]): number {
  return walletCards.reduce((sum, c) => sum + c.annualFee, 0)
}

/**
 * All unique benefit labels from wallet cards (for "Key Existing Benefits").
 */
export function getCurrentBenefitLabels(walletCards: Card[]): string[] {
  const set = new Set<string>()
  for (const c of walletCards) {
    c.benefits.forEach((b) => set.add(b))
  }
  return Array.from(set)
}

/**
 * Build category-by-category strategy: current best, suggested best (from full catalog),
 * incremental points, and whether already optimized.
 */
function buildCategoryRows(
  monthlySpend: MonthlySpend,
  walletCards: Card[]
): CategoryStrategyRow[] {
  const rows: CategoryStrategyRow[] = []
  for (const categoryId of SPEND_CATEGORIES) {
    const monthly = monthlySpend[categoryId] ?? 0
    const currentBest = getBestCardForCategoryByDollars(walletCards, categoryId, monthly)
    const currentMult = currentBest?.multiplier ?? 0
    const bestInCatalog = getBestCardForCategoryByDollars(CARD_CATALOG, categoryId, monthly)
    const suggestedMult = bestInCatalog?.multiplier ?? 0
    const suggestedCard = bestInCatalog?.card ?? null
    const currentAnnualDollars = currentBest?.annualDollars ?? 0
    const suggestedAnnualDollars = bestInCatalog?.annualDollars ?? 0
    const isOptimized = suggestedAnnualDollars <= currentAnnualDollars || suggestedMult === 0
    const incrementalAnnualPoints = isOptimized
      ? 0
      : Math.round((bestInCatalog?.annualPoints ?? 0) - (currentBest?.annualPoints ?? 0))
    const incrementalAnnualDollars = isOptimized
      ? 0
      : Math.round(suggestedAnnualDollars - currentAnnualDollars)

    rows.push({
      categoryId,
      categoryLabel: CATEGORY_LABELS[categoryId],
      currentBestCard: currentBest?.card ?? null,
      currentMultiplier: currentMult,
      suggestedCard: isOptimized ? null : suggestedCard,
      suggestedMultiplier: suggestedMult,
      incrementalAnnualPoints,
      incrementalAnnualDollars,
      isOptimized,
    })
  }
  return rows
}

/**
 * Pick a single "recommended" card to add: the one that appears most in suggestions
 * and has the highest total incremental contribution (or first by id for tie).
 */
function pickRecommendedCard(rows: CategoryStrategyRow[]): Card | null {
  const byCardId = new Map<string, number>()
  for (const row of rows) {
    if (row.suggestedCard && row.incrementalAnnualDollars > 0) {
      const id = row.suggestedCard.id
      byCardId.set(id, (byCardId.get(id) ?? 0) + row.incrementalAnnualDollars)
    }
  }
  if (byCardId.size === 0) return null
  let bestId: string | null = null
  let bestDollars = 0
  for (const [id, dollars] of byCardId) {
    if (dollars > bestDollars) {
      bestDollars = dollars
      bestId = id
    }
  }
  return bestId ? getCardById(bestId) ?? null : null
}

/**
 * Build summary reason string (e.g. "Adding United Explorer and dropping Amex Gold").
 */
function buildSummaryReason(
  recommendedCard: Card | null,
  walletCards: Card[],
  categoryRows: CategoryStrategyRow[]
): string {
  if (!recommendedCard) return "No changes recommended — you're already optimized."
  const added = recommendedCard.name
  // Optionally suggest dropping a card that's redundant (same or lower multiplier in suggested categories)
  const suggestedCategories = categoryRows
    .filter((r) => r.suggestedCard?.id === recommendedCard.id)
    .map((r) => r.categoryId)
  let dropped = ""
  for (const c of walletCards) {
    if (c.id === recommendedCard.id) continue
    const onlyUsedIn = suggestedCategories.filter((cat) => {
      const row = categoryRows.find((r) => r.categoryId === cat)
      return row?.currentBestCard?.id === c.id
    })
    if (onlyUsedIn.length > 0) {
      dropped = c.name
      break
    }
  }
  if (dropped) return `Achieved by adding the ${added} to your portfolio and dropping the ${dropped}.`
  return `Achieved by adding the ${added} to your portfolio.`
}

/**
 * Full strategy computation: current vs max potential, category table, recommended card.
 */
export function computeStrategy(
  monthlySpend: MonthlySpend,
  walletCardIds: string[]
): StrategyResult {
  const walletCards = walletCardIds
    .map((id) => getCardById(id))
    .filter((c): c is Card => c !== undefined)

  const currentAnnualPoints = calculateCurrentAnnualPoints(monthlySpend, walletCards)
  const currentAnnualDollars = calculateCurrentAnnualDollars(monthlySpend, walletCards)
  const currentAnnualFee = getCurrentAnnualFee(walletCards)
  const currentBenefitLabels = getCurrentBenefitLabels(walletCards)

  const categoryRows = buildCategoryRows(monthlySpend, walletCards)
  const totalIncremental = categoryRows.reduce((s, r) => s + r.incrementalAnnualPoints, 0)
  const totalIncrementalDollars = categoryRows.reduce((s, r) => s + r.incrementalAnnualDollars, 0)
  const maxPotentialAnnualPoints = currentAnnualPoints + totalIncremental
  const maxPotentialAnnualDollars = currentAnnualDollars + totalIncrementalDollars

  const recommendedCard = pickRecommendedCard(categoryRows)
  const additionalBenefitLabels = recommendedCard
    ? recommendedCard.benefits.filter((b) => !currentBenefitLabels.includes(b))
    : []
  const netAdditionalFee = recommendedCard ? recommendedCard.annualFee : 0

  const summaryReason = buildSummaryReason(recommendedCard, walletCards, categoryRows)

  // Display cpp: prefer first wallet card's base cpp, else recommended card's, else default 1.25 cpp (125)
  const displayCppCents =
    walletCards[0]?.pointsValueBaseCents ??
    recommendedCard?.pointsValueBaseCents ??
    DEFAULT_CPP_CENTS
  const estimatedValueCurrentDollars = currentAnnualDollars
  const estimatedValueMaxDollars = maxPotentialAnnualDollars
  const strategyAssumptions = Object.values(SUBCATEGORY_SPEND_ASSUMPTIONS).map(
    (assumption) => assumption.note
  )

  return {
    currentAnnualPoints,
    currentAnnualDollars,
    currentAnnualFee,
    currentBenefitLabels,
    maxPotentialAnnualPoints,
    maxPotentialAnnualDollars,
    incrementalAnnualPoints: totalIncremental,
    incrementalAnnualDollars: totalIncrementalDollars,
    netAdditionalFee,
    additionalBenefitLabels,
    categoryRows,
    recommendedCard,
    summaryReason,
    estimatedValueCurrentDollars,
    estimatedValueMaxDollars,
    displayCppCents,
    strategyAssumptions,
  }
}
