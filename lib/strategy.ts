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

/**
 * For a set of cards, get the best multiplier for a category (max across cards).
 */
function getBestMultiplierInSet(cards: Card[], categoryId: SpendCategoryId): number {
  if (cards.length === 0) return 0
  return Math.max(...cards.map((c) => c.categoryMultipliers[categoryId] ?? 0))
}

/**
 * Find the card in the set that has the best multiplier for this category.
 * Ties: first one wins.
 */
function getBestCardForCategory(
  cards: Card[],
  categoryId: SpendCategoryId
): { card: Card; multiplier: number } | null {
  if (cards.length === 0) return null
  let best: Card | null = null
  let bestMult = 0
  for (const c of cards) {
    const m = c.categoryMultipliers[categoryId] ?? 0
    if (m > bestMult) {
      bestMult = m
      best = c
    }
  }
  return best ? { card: best, multiplier: bestMult } : null
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
    const mult = getBestMultiplierInSet(walletCards, cat)
    const monthly = monthlySpend[cat] ?? 0
    total += monthly * mult * MONTHS_PER_YEAR
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
    const currentBest = getBestCardForCategory(walletCards, categoryId)
    const currentMult = currentBest?.multiplier ?? 0
    const bestInCatalog = getBestCardForCategory(CARD_CATALOG, categoryId)
    const suggestedMult = bestInCatalog?.multiplier ?? 0
    const suggestedCard = bestInCatalog?.card ?? null
    const isOptimized = suggestedMult <= currentMult || suggestedMult === 0
    const incrementalAnnualPoints = isOptimized
      ? 0
      : Math.round((suggestedMult - currentMult) * monthly * MONTHS_PER_YEAR)

    rows.push({
      categoryId,
      categoryLabel: CATEGORY_LABELS[categoryId],
      currentBestCard: currentBest?.card ?? null,
      currentMultiplier: currentMult,
      suggestedCard: isOptimized ? null : suggestedCard,
      suggestedMultiplier: suggestedMult,
      incrementalAnnualPoints,
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
    if (row.suggestedCard && row.incrementalAnnualPoints > 0) {
      const id = row.suggestedCard.id
      byCardId.set(id, (byCardId.get(id) ?? 0) + row.incrementalAnnualPoints)
    }
  }
  if (byCardId.size === 0) return null
  let bestId: string | null = null
  let bestPoints = 0
  for (const [id, points] of byCardId) {
    if (points > bestPoints) {
      bestPoints = points
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
  const currentAnnualFee = getCurrentAnnualFee(walletCards)
  const currentBenefitLabels = getCurrentBenefitLabels(walletCards)

  const categoryRows = buildCategoryRows(monthlySpend, walletCards)
  const totalIncremental = categoryRows.reduce((s, r) => s + r.incrementalAnnualPoints, 0)
  const maxPotentialAnnualPoints = currentAnnualPoints + totalIncremental

  const recommendedCard = pickRecommendedCard(categoryRows)
  const additionalBenefitLabels = recommendedCard
    ? recommendedCard.benefits.filter((b) => !currentBenefitLabels.includes(b))
    : []
  const netAdditionalFee = recommendedCard ? recommendedCard.annualFee : 0

  const summaryReason = buildSummaryReason(recommendedCard, walletCards, categoryRows)

  return {
    currentAnnualPoints,
    currentAnnualFee,
    currentBenefitLabels,
    maxPotentialAnnualPoints,
    incrementalAnnualPoints: totalIncremental,
    netAdditionalFee,
    additionalBenefitLabels,
    categoryRows,
    recommendedCard,
    summaryReason,
  }
}
