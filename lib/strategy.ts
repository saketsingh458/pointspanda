import type {
  CapPeriod,
  Card,
  CategoryEarnRate,
  MonthlySpend,
  CategoryStrategyRow,
  SpendCategoryId,
  StrategyAssumption,
  StrategyLimitation,
  StrategyResult,
  TravelSubtype,
} from "@/lib/types"
import { SPEND_CATEGORIES } from "@/lib/types"
import { CARD_CATALOG, CATEGORY_LABELS, getCardById } from "@/lib/cards"
import {
  BENCHMARK_SOURCES,
  DEFAULT_CAP_PERIOD_ASSUMPTION,
  DEFAULT_CHANNEL_SHARE_BY_SUBTYPE,
  DEFAULT_TRAVEL_SUBTYPE_MIX,
} from "@/lib/strategy-assumptions"

const MONTHS_PER_YEAR = 12
const DEFAULT_CPP_CENTS = 125
type AssumptionCollector = Map<string, StrategyAssumption>

function addAssumption(
  assumptionNotes: AssumptionCollector,
  assumption: StrategyAssumption
): void {
  if (!assumptionNotes.has(assumption.id)) {
    assumptionNotes.set(assumption.id, assumption)
  }
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

function inferCapPeriodFromAmount(capAmount: number): CapPeriod {
  if (capAmount >= 3000) return "annual"
  if (capAmount >= 500) return "quarterly"
  return "monthly"
}

function capToMonthly(
  capAmount: number | undefined,
  capPeriod: CapPeriod | undefined,
  assumptionNotes: AssumptionCollector,
  capContext?: string
): number | null {
  if (capAmount == null || capAmount <= 0) return null
  const normalizedPeriod = capPeriod ?? inferCapPeriodFromAmount(capAmount)
  if (!capPeriod) {
    addAssumption(assumptionNotes, {
      id: "cap_period_inference",
      title: "Cap period defaults",
      assumption:
        "When a cap period is missing, caps of $3,000+ are treated as annual, $500-$2,999 as quarterly, and under $500 as monthly.",
      whyItMatters: "This keeps capped earn rates usable even when source data omits the period.",
      sourceLabel: `Strategy fallback (${DEFAULT_CAP_PERIOD_ASSUMPTION})`,
    })
    if (capContext) {
      addAssumption(assumptionNotes, {
        id: `cap_period_inference_${capContext}`,
        title: "Missing cap period encountered",
        assumption: `A missing cap period was inferred for "${capContext}".`,
      })
    }
  }
  if (normalizedPeriod === "annual") return capAmount / 12
  if (normalizedPeriod === "quarterly") return capAmount / 3
  return capAmount
}

function getRateMonthlyPoints(
  monthlySpendAmount: number,
  baseRate: number,
  rate: CategoryEarnRate,
  assumptionNotes: AssumptionCollector
): number {
  const monthlyCap = capToMonthly(
    rate.capAmount,
    rate.capPeriod,
    assumptionNotes,
    rate.rawKey ?? rate.channel
  )
  if (monthlyCap == null) return monthlySpendAmount * rate.multiplier
  const boostedMonthlySpend = Math.min(monthlySpendAmount, monthlyCap)
  const uncappedMonthlySpend = Math.max(0, monthlySpendAmount - boostedMonthlySpend)
  return boostedMonthlySpend * rate.multiplier + uncappedMonthlySpend * baseRate
}

function getRatePoolKey(rate: CategoryEarnRate): string {
  if (rate.rawKey) return rate.rawKey
  return `${rate.channel}|${rate.multiplier}|${rate.capAmount ?? "nocap"}|${rate.capPeriod ?? "auto"}`
}

function getSegmentPointsWithCapPool(
  segmentSpend: number,
  baseRate: number,
  rate: CategoryEarnRate,
  assumptionNotes: AssumptionCollector,
  remainingCapByRate: Map<string, number>
): { points: number; consumedCap: number } {
  const monthlyCap = capToMonthly(
    rate.capAmount,
    rate.capPeriod,
    assumptionNotes,
    rate.rawKey ?? rate.channel
  )
  if (monthlyCap == null) {
    return { points: segmentSpend * rate.multiplier, consumedCap: 0 }
  }

  const poolKey = getRatePoolKey(rate)
  const existing = remainingCapByRate.get(poolKey)
  const remainingCap = existing == null ? monthlyCap : existing
  const boostedSpend = Math.min(segmentSpend, Math.max(0, remainingCap))
  const uncappedSpend = Math.max(0, segmentSpend - boostedSpend)
  return {
    points: boostedSpend * rate.multiplier + uncappedSpend * baseRate,
    consumedCap: boostedSpend,
  }
}

function getDisplayMultiplier(card: Card, categoryId: SpendCategoryId): number {
  if (categoryId === "other") {
    return card.categoryMultipliers.other ?? card.baseRate ?? 0
  }
  const details = card.categoryEarnDetails?.[categoryId] ?? []
  if (details.length > 0) {
    return details.reduce((best, detail) => Math.max(best, detail.multiplier), card.baseRate ?? 0)
  }
  return card.categoryMultipliers[categoryId] ?? card.baseRate ?? 0
}

function getSimpleCategoryMonthlyPoints(
  card: Card,
  categoryId: SpendCategoryId,
  monthlySpendAmount: number,
  assumptionNotes: AssumptionCollector
): number {
  const monthly = Math.max(0, monthlySpendAmount)
  const baseRate = card.baseRate ?? 0
  const details = card.categoryEarnDetails?.[categoryId] ?? []

  if (details.length > 0) {
    let best = monthly * baseRate
    for (const detail of details) {
      const points = getRateMonthlyPoints(monthly, baseRate, detail, assumptionNotes)
      if (points > best) best = points
    }
    return best
  }

  const categoryMultiplier = card.categoryMultipliers[categoryId] ?? baseRate
  const legacyMonthlyCap = capToMonthly(
    card.categoryCaps?.[categoryId],
    undefined,
    assumptionNotes,
    `legacy_${categoryId}`
  )
  if (legacyMonthlyCap == null) return monthly * categoryMultiplier
  const boostedMonthlySpend = Math.min(monthly, legacyMonthlyCap)
  const uncappedMonthlySpend = Math.max(0, monthly - boostedMonthlySpend)
  return boostedMonthlySpend * categoryMultiplier + uncappedMonthlySpend * baseRate
}

function isSubtypeMatch(rateSubtype: TravelSubtype | undefined, segmentSubtype: TravelSubtype): boolean {
  if (!rateSubtype || rateSubtype === "general") return true
  return rateSubtype === segmentSubtype
}

function isChannelMatch(rate: CategoryEarnRate, segmentChannel: "portal" | "direct"): boolean {
  if (rate.requiresPortal === true) return segmentChannel === "portal"
  if (rate.bookingChannel === "portal") return segmentChannel === "portal"
  if (rate.bookingChannel === "direct") return segmentChannel === "direct"
  return true
}

function getTravelCategoryMonthlyPoints(
  card: Card,
  monthlySpendAmount: number,
  assumptionNotes: AssumptionCollector
): number {
  const monthly = Math.max(0, monthlySpendAmount)
  const baseRate = card.baseRate ?? 0
  const travelRates = card.categoryEarnDetails?.travel ?? []
  if (travelRates.length === 0) {
    return getSimpleCategoryMonthlyPoints(card, "travel", monthly, assumptionNotes)
  }

  let total = 0
  const remainingCapByRate = new Map<string, number>()
  const subtypeOrder: TravelSubtype[] = ["hotel", "flight", "car", "general"]
  const channelOrder: Array<"portal" | "direct"> = ["portal", "direct"]

  for (const subtype of subtypeOrder) {
    const subtypeSpend = monthly * DEFAULT_TRAVEL_SUBTYPE_MIX[subtype]
    for (const channel of channelOrder) {
      const segmentSpend = subtypeSpend * DEFAULT_CHANNEL_SHARE_BY_SUBTYPE[subtype][channel]
      if (segmentSpend <= 0) continue
      let bestSegmentPoints = segmentSpend * baseRate
      let bestRate: CategoryEarnRate | null = null
      let bestConsumedCap = 0
      for (const rate of travelRates) {
        if (!isSubtypeMatch(rate.travelSubtype, subtype)) continue
        if (!isChannelMatch(rate, channel)) continue
        const { points, consumedCap } = getSegmentPointsWithCapPool(
          segmentSpend,
          baseRate,
          rate,
          assumptionNotes,
          remainingCapByRate
        )
        if (points > bestSegmentPoints) {
          bestSegmentPoints = points
          bestRate = rate
          bestConsumedCap = consumedCap
        }
      }
      if (bestRate && bestConsumedCap > 0) {
        const poolKey = getRatePoolKey(bestRate)
        const monthlyCap = capToMonthly(
          bestRate.capAmount,
          bestRate.capPeriod,
          assumptionNotes,
          bestRate.rawKey ?? bestRate.channel
        )
        if (monthlyCap != null) {
          const existing = remainingCapByRate.get(poolKey)
          const currentRemaining = existing == null ? monthlyCap : existing
          remainingCapByRate.set(poolKey, Math.max(0, currentRemaining - bestConsumedCap))
        }
      }
      total += bestSegmentPoints
    }
  }

  return total
}

function getMonthlyPointsForCardCategory(
  card: Card,
  categoryId: SpendCategoryId,
  monthlySpendAmount: number,
  assumptionNotes: AssumptionCollector
): number {
  if (categoryId === "travel") {
    return getTravelCategoryMonthlyPoints(card, monthlySpendAmount, assumptionNotes)
  }
  return getSimpleCategoryMonthlyPoints(card, categoryId, monthlySpendAmount, assumptionNotes)
}

/**
 * Compute annual points for one card/category using expected-value channel/subtype weights.
 */
function getAnnualPointsForCardCategory(
  card: Card,
  categoryId: SpendCategoryId,
  monthlySpendAmount: number,
  assumptionNotes: AssumptionCollector
): { annualPoints: number } {
  const monthlyPoints = getMonthlyPointsForCardCategory(card, categoryId, monthlySpendAmount, assumptionNotes)
  const annualPoints = monthlyPoints * MONTHS_PER_YEAR
  return { annualPoints }
}

/**
 * Find the card in the set with best annual dollar earn for a category.
 * Ties: first one wins.
 */
function getBestCardForCategoryByDollars(
  cards: Card[],
  categoryId: SpendCategoryId,
  monthlySpendAmount: number,
  assumptionNotes: AssumptionCollector
): { card: Card; multiplier: number; annualPoints: number; annualDollars: number } | null {
  if (cards.length === 0) return null
  let best: Card | null = null
  let bestAnnualPoints = 0
  let bestAnnualDollars = 0
  let bestDisplayMultiplier = 0

  for (const c of cards) {
    const { annualPoints } = getAnnualPointsForCardCategory(c, categoryId, monthlySpendAmount, assumptionNotes)
    const annualDollars = pointsToDollars(annualPoints, getCardCppCents(c))
    if (annualDollars > bestAnnualDollars) {
      best = c
      bestAnnualPoints = annualPoints
      bestAnnualDollars = annualDollars
      bestDisplayMultiplier = getDisplayMultiplier(c, categoryId)
    }
  }

  return best
    ? {
        card: best,
        multiplier: bestDisplayMultiplier,
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
  walletCards: Card[],
  assumptionNotes: AssumptionCollector
): number {
  if (walletCards.length === 0) return 0
  let total = 0
  for (const cat of SPEND_CATEGORIES) {
    const monthly = monthlySpend[cat] ?? 0
    const best = getBestCardForCategoryByDollars(walletCards, cat, monthly, assumptionNotes)
    total += best?.annualPoints ?? 0
  }
  return Math.round(total)
}

function calculateCurrentAnnualDollars(
  monthlySpend: MonthlySpend,
  walletCards: Card[],
  assumptionNotes: AssumptionCollector
): number {
  if (walletCards.length === 0) return 0
  let total = 0
  for (const cat of SPEND_CATEGORIES) {
    const monthly = monthlySpend[cat] ?? 0
    const best = getBestCardForCategoryByDollars(walletCards, cat, monthly, assumptionNotes)
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
  walletCards: Card[],
  recommendedCard: Card | null,
  assumptionNotes: AssumptionCollector
): CategoryStrategyRow[] {
  const scenarioCards = recommendedCard ? [...walletCards, recommendedCard] : walletCards
  const rows: CategoryStrategyRow[] = []
  for (const categoryId of SPEND_CATEGORIES) {
    const monthly = monthlySpend[categoryId] ?? 0
    const currentBest = getBestCardForCategoryByDollars(
      walletCards,
      categoryId,
      monthly,
      assumptionNotes
    )
    const currentMult = currentBest?.multiplier ?? 0
    const bestInScenario = getBestCardForCategoryByDollars(
      scenarioCards,
      categoryId,
      monthly,
      assumptionNotes
    )
    const suggestedMult = bestInScenario?.multiplier ?? 0
    const suggestedCard = bestInScenario?.card ?? null
    const currentAnnualDollars = currentBest?.annualDollars ?? 0
    const suggestedAnnualDollars = bestInScenario?.annualDollars ?? 0
    const isOptimized = suggestedAnnualDollars <= currentAnnualDollars || suggestedMult === 0
    const incrementalAnnualPoints = isOptimized
      ? 0
      : Math.round((bestInScenario?.annualPoints ?? 0) - (currentBest?.annualPoints ?? 0))
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

interface CandidateEvaluation {
  recommendedCard: Card | null
  grossIncrementalPoints: number
  grossIncrementalDollars: number
  bestGrossIncrementalDollars: number
}

function evaluateBestCandidate(
  monthlySpend: MonthlySpend,
  walletCards: Card[],
  currentAnnualPoints: number,
  currentAnnualDollars: number,
  assumptionNotes: AssumptionCollector
): CandidateEvaluation {
  const walletIds = new Set(walletCards.map((card) => card.id))
  let recommendedCard: Card | null = null
  let bestNetIncrementalDollars = 0
  let bestGrossIncrementalDollars = 0
  let bestGrossIncrementalPoints = 0
  let bestCandidateGrossIncrementalDollars = 0

  for (const candidate of CARD_CATALOG) {
    if (walletIds.has(candidate.id)) continue
    const candidateWallet = [...walletCards, candidate]
    const candidateAnnualDollars = calculateCurrentAnnualDollars(
      monthlySpend,
      candidateWallet,
      assumptionNotes
    )
    const candidateAnnualPoints = calculateCurrentAnnualPoints(
      monthlySpend,
      candidateWallet,
      assumptionNotes
    )
    const grossIncrementalDollars = Math.max(0, candidateAnnualDollars - currentAnnualDollars)
    const grossIncrementalPoints = Math.max(0, candidateAnnualPoints - currentAnnualPoints)
    const netIncrementalDollars = grossIncrementalDollars - candidate.annualFee
    bestCandidateGrossIncrementalDollars = Math.max(
      bestCandidateGrossIncrementalDollars,
      grossIncrementalDollars
    )
    if (
      netIncrementalDollars > bestNetIncrementalDollars ||
      (netIncrementalDollars === bestNetIncrementalDollars &&
        grossIncrementalDollars > bestGrossIncrementalDollars)
    ) {
      recommendedCard = candidate
      bestNetIncrementalDollars = netIncrementalDollars
      bestGrossIncrementalDollars = grossIncrementalDollars
      bestGrossIncrementalPoints = grossIncrementalPoints
    }
  }

  return {
    recommendedCard,
    grossIncrementalPoints: recommendedCard ? bestGrossIncrementalPoints : 0,
    grossIncrementalDollars: recommendedCard ? bestGrossIncrementalDollars : 0,
    bestGrossIncrementalDollars: bestCandidateGrossIncrementalDollars,
  }
}

/**
 * Build summary reason string (e.g. "Adding United Explorer and dropping Amex Gold").
 */
function buildSummaryReason(
  recommendedCard: Card | null,
  hasGrossOpportunity: boolean,
  walletCardCount: number
): string {
  if (!recommendedCard) {
    return hasGrossOpportunity
      ? "No changes recommended — no single new card improves your net annual value after fee."
      : "No changes recommended — you're already optimized."
  }
  if (walletCardCount === 0) {
    return `${recommendedCard.name} is your best starter card for net annual value.`
  }
  return `${recommendedCard.name} gives the highest net annual value boost when added to your portfolio.`
}

function getStrategyLimitations(): StrategyLimitation[] {
  return [
    {
      id: "fixed_travel_mix",
      title: "Travel behavior is estimated",
      limitation:
        "Travel spend is split into a fixed mix across hotels, flights, car rentals, and other travel, plus a fixed portal vs direct booking split.",
      whyItMatters:
        "If your travel pattern is different, your real card value can be higher or lower than shown.",
    },
    {
      id: "missing_cap_period_guess",
      title: "Some card caps may be guessed",
      limitation:
        "When a card's cap period is missing in source data, we infer whether that cap is monthly, quarterly, or annual.",
      whyItMatters:
        "A wrong cap-period guess can change estimated rewards for that card.",
    },
    {
      id: "single_card_recommendation",
      title: "Recommendation is limited to one new card",
      limitation:
        "The strategy picks only one card to add, even if the best real setup might involve adding two cards or replacing an existing card.",
      whyItMatters: "You may be able to do better with a multi-card or swap strategy.",
    },
    {
      id: "fee_aware_but_perks_excluded",
      title: "Ranking includes fee, but not full perks valuation",
      limitation:
        "Card ranking is portfolio-level and uses net rewards uplift minus the added annual fee for one new card; category rows remain a rewards-only view for explanation, while statement credits and perks are shown separately instead of fully priced into ranking.",
      whyItMatters:
        "Cards with strong credits or benefits can still be under- or over-valued in the recommendation.",
    },
    {
      id: "signup_bonus_excluded",
      title: "Sign-up bonus is not part of ranking",
      limitation:
        "Welcome offers are displayed but are not included in the core ranking logic.",
      whyItMatters:
        "If you care most about first-year value, your best card choice may differ.",
    },
    {
      id: "flat_monthly_projection",
      title: "Annual value assumes stable monthly spend",
      limitation:
        "We estimate one typical month and multiply by 12, instead of modeling seasonal or one-time spikes.",
      whyItMatters:
        "If your spending changes a lot across the year, actual results can differ.",
    },
  ]
}

/**
 * Full strategy computation: current vs max potential, category table, recommended card.
 */
export function computeStrategy(
  monthlySpend: MonthlySpend,
  walletCardIds: string[]
): StrategyResult {
  const assumptionNotes: AssumptionCollector = new Map()
  addAssumption(assumptionNotes, {
    id: "travel_subtype_mix",
    title: "Travel spend mix",
    assumption: "Travel spend is estimated as 40% hotels, 35% flights, 10% car rentals, and 15% other travel.",
    whyItMatters: "Cards can have different earn rates by travel subtype, so this split affects expected points.",
    sourceLabel: "Deloitte 2024 US summer travel trends",
  })
  addAssumption(assumptionNotes, {
    id: "travel_booking_channel_mix",
    title: "Travel booking channel mix",
    assumption:
      "Each travel subtype is split 50/50 between issuer portal bookings and direct bookings.",
    whyItMatters: "Many travel multipliers depend on booking channel.",
    sourceLabel: "Phocuswright OTA market framing",
  })
  addAssumption(assumptionNotes, {
    id: "shared_travel_cap_pool",
    title: "Shared travel cap pool",
    assumption:
      "When one travel earn rule has a cap, the cap is shared across matching travel segments to avoid counting the same capped dollars twice.",
    whyItMatters: "This keeps capped earnings conservative and prevents overestimation.",
    sourceLabel: "Internal strategy rule",
  })
  addAssumption(assumptionNotes, {
    id: "benchmark_anchors",
    title: "Benchmark anchors",
    assumption: "Travel defaults are anchored to public travel-industry benchmarks and issuer-distribution behavior.",
    sourceLabel: `${BENCHMARK_SOURCES.join("; ")} (see data/issuer_earn_rate_sources_us_usd.md)`,
  })

  const walletCards = walletCardIds
    .map((id) => getCardById(id))
    .filter((c): c is Card => c !== undefined)

  const currentAnnualPoints = calculateCurrentAnnualPoints(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualDollars = calculateCurrentAnnualDollars(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualFee = getCurrentAnnualFee(walletCards)
  const currentBenefitLabels = getCurrentBenefitLabels(walletCards)

  const candidateEvaluation = evaluateBestCandidate(
    monthlySpend,
    walletCards,
    currentAnnualPoints,
    currentAnnualDollars,
    assumptionNotes
  )
  const recommendedCard = candidateEvaluation.recommendedCard
  const categoryRows = buildCategoryRows(monthlySpend, walletCards, recommendedCard, assumptionNotes)
  const totalIncremental = categoryRows.reduce((sum, row) => sum + row.incrementalAnnualPoints, 0)
  const totalIncrementalDollars = categoryRows.reduce(
    (sum, row) => sum + row.incrementalAnnualDollars,
    0
  )
  const maxPotentialAnnualPoints = currentAnnualPoints + totalIncremental
  const maxPotentialAnnualDollars = currentAnnualDollars + totalIncrementalDollars

  const additionalBenefitLabels = recommendedCard
    ? recommendedCard.benefits.filter((b) => !currentBenefitLabels.includes(b))
    : []
  const netAdditionalFee = recommendedCard ? recommendedCard.annualFee : 0

  const summaryReason = buildSummaryReason(
    recommendedCard,
    candidateEvaluation.bestGrossIncrementalDollars > 0,
    walletCards.length
  )

  // Display cpp: prefer first wallet card's base cpp, else recommended card's, else default 1.25 cpp (125)
  const displayCppCents =
    walletCards[0]?.pointsValueBaseCents ??
    recommendedCard?.pointsValueBaseCents ??
    DEFAULT_CPP_CENTS
  const estimatedValueCurrentDollars = currentAnnualDollars
  const estimatedValueMaxDollars = maxPotentialAnnualDollars
  const strategyAssumptions = Array.from(assumptionNotes.values())
  const strategyLimitations = getStrategyLimitations()

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
    strategyLimitations,
  }
}
