import type {
  CapPeriod,
  Card,
  CategoryEarnRate,
  EcosystemStrategyOption,
  MonthlySpend,
  CategoryStrategyRow,
  SpendCategoryId,
  StrategyAssumption,
  StrategyLimitation,
  StrategyPageData,
  StrategyPortfolioSummary,
  StrategyResult,
  StrategyViewId,
  TravelSubtype,
} from "@/lib/types"
import { SPEND_CATEGORIES } from "@/lib/types"
import {
  CARD_CATALOG,
  CATEGORY_LABELS,
  getCardById,
  getCardRankingCppCents,
  getCardCppSources,
} from "@/lib/cards"
import {
  BENCHMARK_SOURCES,
  DEFAULT_CAP_PERIOD_ASSUMPTION,
  DEFAULT_CHANNEL_SHARE_BY_SUBTYPE,
  DEFAULT_TRAVEL_SUBTYPE_MIX,
} from "@/lib/strategy-assumptions"

const MONTHS_PER_YEAR = 12
const DEFAULT_CPP_CENTS = 125
const MAX_ECOSYSTEM_PORTFOLIO_SIZE = 4
type AssumptionCollector = Map<string, StrategyAssumption>

function addAssumption(
  assumptionNotes: AssumptionCollector,
  assumption: StrategyAssumption
): void {
  if (!assumptionNotes.has(assumption.id)) {
    assumptionNotes.set(assumption.id, assumption)
  }
}

/** CPP used for strategy ranking (assumed > nerdwallet > pointsguy > legacy base). */
function getCardCppCents(card: Card): number {
  return getCardRankingCppCents(card)
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

function createAssumptionCollector(): AssumptionCollector {
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
  return assumptionNotes
}

function calculateAnnualMetrics(
  monthlySpend: MonthlySpend,
  cards: Card[],
  assumptionNotes: AssumptionCollector
): { annualPoints: number; annualDollars: number } {
  if (cards.length === 0) {
    return { annualPoints: 0, annualDollars: 0 }
  }

  let annualPoints = 0
  let annualDollars = 0
  for (const categoryId of SPEND_CATEGORIES) {
    const monthly = monthlySpend[categoryId] ?? 0
    const best = getBestCardForCategoryByDollars(cards, categoryId, monthly, assumptionNotes)
    annualPoints += best?.annualPoints ?? 0
    annualDollars += best?.annualDollars ?? 0
  }

  return {
    annualPoints: Math.round(annualPoints),
    annualDollars: Math.round(annualDollars),
  }
}

/**
 * Current annual points: for each category, use best multiplier from wallet × monthly spend × 12.
 */
export function calculateCurrentAnnualPoints(
  monthlySpend: MonthlySpend,
  walletCards: Card[],
  assumptionNotes: AssumptionCollector
): number {
  return calculateAnnualMetrics(monthlySpend, walletCards, assumptionNotes).annualPoints
}

function calculateCurrentAnnualDollars(
  monthlySpend: MonthlySpend,
  walletCards: Card[],
  assumptionNotes: AssumptionCollector
): number {
  return calculateAnnualMetrics(monthlySpend, walletCards, assumptionNotes).annualDollars
}

/**
 * Current total annual fee from wallet cards.
 */
export function getCurrentAnnualFee(walletCards: Card[]): number {
  return walletCards.reduce((sum, c) => sum + c.annualFee, 0)
}

function getBenefitLabels(cards: Card[]): string[] {
  const set = new Set<string>()
  for (const c of cards) {
    c.benefits.forEach((b) => set.add(b))
  }
  return Array.from(set)
}

/**
 * All unique benefit labels from wallet cards (for "Key Existing Benefits").
 */
export function getCurrentBenefitLabels(walletCards: Card[]): string[] {
  return getBenefitLabels(walletCards)
}

function getPortfolioSummary(
  monthlySpend: MonthlySpend,
  cards: Card[],
  assumptionNotes: AssumptionCollector
): StrategyPortfolioSummary {
  const metrics = calculateAnnualMetrics(monthlySpend, cards, assumptionNotes)
  const annualFee = getCurrentAnnualFee(cards)
  return {
    cards,
    annualPoints: metrics.annualPoints,
    annualDollars: metrics.annualDollars,
    annualFee,
    netAnnualValue: Math.round(metrics.annualDollars - annualFee),
    benefitLabels: getBenefitLabels(cards),
  }
}

/**
 * Build category-by-category strategy comparing the user's current wallet to a scenario portfolio.
 */
function buildCategoryRows(
  monthlySpend: MonthlySpend,
  currentCards: Card[],
  scenarioCards: Card[],
  assumptionNotes: AssumptionCollector
): CategoryStrategyRow[] {
  const rows: CategoryStrategyRow[] = []
  for (const categoryId of SPEND_CATEGORIES) {
    const monthly = monthlySpend[categoryId] ?? 0
    const currentBest = getBestCardForCategoryByDollars(
      currentCards,
      categoryId,
      monthly,
      assumptionNotes
    )
    const scenarioBest = getBestCardForCategoryByDollars(
      scenarioCards,
      categoryId,
      monthly,
      assumptionNotes
    )
    const currentMult = currentBest?.multiplier ?? 0
    const suggestedMult = scenarioBest?.multiplier ?? 0
    const suggestedCard = scenarioBest?.card ?? null
    const incrementalAnnualPoints = Math.round(
      (scenarioBest?.annualPoints ?? 0) - (currentBest?.annualPoints ?? 0)
    )
    const incrementalAnnualDollars = Math.round(
      (scenarioBest?.annualDollars ?? 0) - (currentBest?.annualDollars ?? 0)
    )
    const isOptimized =
      (currentBest?.card.id ?? null) === (scenarioBest?.card.id ?? null) && incrementalAnnualDollars === 0

    rows.push({
      categoryId,
      categoryLabel: CATEGORY_LABELS[categoryId],
      currentBestCard: currentBest?.card ?? null,
      currentMultiplier: currentMult,
      suggestedCard,
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
  bestGrossIncrementalDollars: number
}

function evaluateBestCandidate(
  monthlySpend: MonthlySpend,
  walletCards: Card[],
  currentAnnualDollars: number,
  assumptionNotes: AssumptionCollector
): CandidateEvaluation {
  const walletIds = new Set(walletCards.map((card) => card.id))
  let recommendedCard: Card | null = null
  let bestNetIncrementalDollars = 0
  let bestGrossIncrementalDollars = 0
  let bestCandidateGrossIncrementalDollars = 0

  for (const candidate of CARD_CATALOG) {
    if (walletIds.has(candidate.id)) continue
    const candidateWallet = [...walletCards, candidate]
    const candidateAnnualDollars = calculateCurrentAnnualDollars(
      monthlySpend,
      candidateWallet,
      assumptionNotes
    )
    const grossIncrementalDollars = Math.max(0, candidateAnnualDollars - currentAnnualDollars)
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
    }
  }

  return {
    recommendedCard,
    bestGrossIncrementalDollars: bestCandidateGrossIncrementalDollars,
  }
}

function buildNextBestCardSummaryReason(
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

function buildBestSingleCardSummaryReason(card: Card | null): string {
  if (!card) return "No single-card strategy is available."
  return `${card.name} is the strongest one-card strategy for your spending profile after annual fee.`
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getRawEcosystemLabel(card: Card): string | null {
  const synergy = card.synergyEcosystem?.trim()
  if (synergy && !/cash\s*back/i.test(synergy)) return synergy

  const rewardCurrency = card.rewardCurrency?.trim()
  if (rewardCurrency && !/cash\s*back/i.test(rewardCurrency)) return rewardCurrency

  return card.issuer?.trim() ?? rewardCurrency ?? synergy ?? null
}

function normalizeEcosystem(card: Card): { ecosystemId: string; ecosystemLabel: string } | null {
  const rawLabel = getRawEcosystemLabel(card)
  if (!rawLabel) return null

  const normalized = rawLabel.toLowerCase()
  if (
    normalized.includes("ultimate rewards") ||
    normalized.includes("chase ur") ||
    normalized === "chase"
  ) {
    return {
      ecosystemId: "chase-ultimate-rewards",
      ecosystemLabel: "Chase Ultimate Rewards",
    }
  }
  if (normalized.includes("membership rewards")) {
    return {
      ecosystemId: "amex-membership-rewards",
      ecosystemLabel: "American Express Membership Rewards",
    }
  }
  if (normalized.includes("capital one")) {
    return {
      ecosystemId: "capital-one-miles",
      ecosystemLabel: "Capital One Miles",
    }
  }
  if (normalized.includes("thankyou")) {
    return {
      ecosystemId: "citi-thankyou-rewards",
      ecosystemLabel: "Citi ThankYou Rewards",
    }
  }
  if (normalized.includes("bilt")) {
    return {
      ecosystemId: "bilt-rewards",
      ecosystemLabel: "Bilt Rewards",
    }
  }
  if (normalized.includes("wells fargo")) {
    return {
      ecosystemId: "wells-fargo-rewards",
      ecosystemLabel: "Wells Fargo Rewards",
    }
  }

  return {
    ecosystemId: toSlug(rawLabel),
    ecosystemLabel: rawLabel,
  }
}

function groupCardsByEcosystem(cards: Card[]): Map<string, { ecosystemLabel: string; cards: Card[] }> {
  const grouped = new Map<string, { ecosystemLabel: string; cards: Card[] }>()

  for (const card of cards) {
    const ecosystem = normalizeEcosystem(card)
    if (!ecosystem) continue

    const existing = grouped.get(ecosystem.ecosystemId)
    if (existing) {
      existing.cards.push(card)
      continue
    }

    grouped.set(ecosystem.ecosystemId, {
      ecosystemLabel: ecosystem.ecosystemLabel,
      cards: [card],
    })
  }

  return grouped
}

function buildPortfolioCombinations(cards: Card[], maxSize: number): Card[][] {
  const combos: Card[][] = []

  function backtrack(startIndex: number, currentCombo: Card[]) {
    if (currentCombo.length > 0) {
      combos.push([...currentCombo])
    }
    if (currentCombo.length === maxSize) return

    for (let i = startIndex; i < cards.length; i += 1) {
      currentCombo.push(cards[i])
      backtrack(i + 1, currentCombo)
      currentCombo.pop()
    }
  }

  backtrack(0, [])
  return combos
}

function isPortfolioBetter(
  candidate: StrategyPortfolioSummary,
  currentBest: StrategyPortfolioSummary | null
): boolean {
  if (!currentBest) return true
  if (candidate.netAnnualValue !== currentBest.netAnnualValue) {
    return candidate.netAnnualValue > currentBest.netAnnualValue
  }
  if (candidate.annualDollars !== currentBest.annualDollars) {
    return candidate.annualDollars > currentBest.annualDollars
  }
  if (candidate.cards.length !== currentBest.cards.length) {
    return candidate.cards.length < currentBest.cards.length
  }
  return candidate.annualFee < currentBest.annualFee
}

function sortEcosystemOptions(a: EcosystemStrategyOption, b: EcosystemStrategyOption): number {
  if (a.portfolio.netAnnualValue !== b.portfolio.netAnnualValue) {
    return b.portfolio.netAnnualValue - a.portfolio.netAnnualValue
  }
  if (a.portfolio.annualDollars !== b.portfolio.annualDollars) {
    return b.portfolio.annualDollars - a.portfolio.annualDollars
  }
  if (a.portfolio.cards.length !== b.portfolio.cards.length) {
    return a.portfolio.cards.length - b.portfolio.cards.length
  }
  return a.portfolio.annualFee - b.portfolio.annualFee
}

function buildEcosystemSummaryReason(
  ecosystemLabel: string,
  portfolio: StrategyPortfolioSummary
): string {
  if (portfolio.cards.length === 1) {
    return `${ecosystemLabel} performs best as a single-card ecosystem for your spend.`
  }
  return `${ecosystemLabel} performs best as a ${portfolio.cards.length}-card ecosystem portfolio for your spend.`
}

function evaluateBestSingleCard(
  monthlySpend: MonthlySpend,
  assumptionNotes: AssumptionCollector
): Card | null {
  let bestCard: Card | null = null
  let bestPortfolio: StrategyPortfolioSummary | null = null

  for (const candidate of CARD_CATALOG) {
    const portfolio = getPortfolioSummary(monthlySpend, [candidate], assumptionNotes)
    if (isPortfolioBetter(portfolio, bestPortfolio)) {
      bestCard = candidate
      bestPortfolio = portfolio
    }
  }

  return bestCard
}

function evaluateEcosystemOptions(
  monthlySpend: MonthlySpend,
  currentCards: Card[],
  assumptionNotes: AssumptionCollector
): EcosystemStrategyOption[] {
  const grouped = groupCardsByEcosystem(CARD_CATALOG)
  const options: EcosystemStrategyOption[] = []

  for (const [ecosystemId, group] of grouped.entries()) {
    const maxSize = Math.min(MAX_ECOSYSTEM_PORTFOLIO_SIZE, group.cards.length)
    const combinations = buildPortfolioCombinations(group.cards, maxSize)

    let bestPortfolio: StrategyPortfolioSummary | null = null
    let bestRows: CategoryStrategyRow[] = []
    for (const combo of combinations) {
      const portfolio = getPortfolioSummary(monthlySpend, combo, assumptionNotes)
      if (!isPortfolioBetter(portfolio, bestPortfolio)) continue
      bestPortfolio = portfolio
      bestRows = buildCategoryRows(monthlySpend, currentCards, combo, assumptionNotes)
    }

    if (!bestPortfolio) continue
    options.push({
      ecosystemId,
      ecosystemLabel: group.ecosystemLabel,
      portfolio: bestPortfolio,
      categoryRows: bestRows,
      summaryReason: buildEcosystemSummaryReason(group.ecosystemLabel, bestPortfolio),
    })
  }

  return options.sort(sortEcosystemOptions)
}

function getDisplayCppCents(currentCards: Card[], recommendedCards: Card[]): number {
  const card = currentCards[0] ?? recommendedCards[0]
  return card ? getCardRankingCppCents(card) : DEFAULT_CPP_CENTS
}

function getDisplayCppSources(currentCards: Card[], recommendedCards: Card[]): StrategyResult["displayCppSources"] {
  const card = currentCards[0] ?? recommendedCards[0]
  if (!card) return undefined
  return getCardCppSources(card)
}

function getStrategyLimitations(viewId: StrategyViewId): StrategyLimitation[] {
  const baseLimitations: StrategyLimitation[] = [
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
      id: "fee_aware_but_perks_excluded",
      title: "Ranking includes fee, but not full perks valuation",
      limitation:
        "Rankings use rewards value minus annual fee. Statement credits, lounge access, insurance, and similar perks are surfaced in the UI but are not fully monetized in the core ranking logic.",
      whyItMatters:
        "Cards with strong credits or non-points perks can still be under- or over-valued in the recommendation.",
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

  if (viewId === "nextBestCard") {
    return [
      ...baseLimitations,
      {
        id: "single_card_recommendation",
        title: "Recommendation is limited to one new card",
        limitation:
          "This view picks only one new card to add, even if the best real setup might involve adding two cards or replacing an existing card.",
        whyItMatters: "You may be able to do better with a multi-card or swap strategy.",
      },
    ]
  }

  if (viewId === "bestSingleCard") {
    return [
      ...baseLimitations,
      {
        id: "single_card_forced",
        title: "This view forces one-card simplicity",
        limitation:
          "The ranking assumes you want one card to cover every category, even if a multi-card setup would earn materially more.",
        whyItMatters:
          "This makes the result easier to use day to day, but it can understate the value of multi-card strategies.",
      },
    ]
  }

  return [
    ...baseLimitations,
    {
      id: "ecosystem_portfolio_cap",
      title: "Ecosystem portfolio search is capped",
      limitation:
        `The ecosystem optimizer evaluates portfolios up to ${MAX_ECOSYSTEM_PORTFOLIO_SIZE} cards per ecosystem instead of searching every possible portfolio size.`,
      whyItMatters:
        "A larger ecosystem setup could theoretically beat the displayed recommendation, especially if your spend is spread across many categories.",
    },
    {
      id: "ecosystem_from_scratch",
      title: "Ecosystem view is optimized from scratch",
      limitation:
        "This view ignores your current wallet composition when building the recommended ecosystem portfolio and instead starts fresh within each ecosystem.",
      whyItMatters:
        "The best ecosystem from scratch may differ from the best upgrade path from what you hold today.",
    },
  ]
}

function buildStrategyResult({
  viewId,
  currentAnnualPoints,
  currentAnnualDollars,
  currentAnnualFee,
  currentBenefitLabels,
  scenarioPortfolio,
  categoryRows,
  recommendedCards,
  summaryReason,
  strategyAssumptions,
  strategyLimitations,
  ecosystemId,
  ecosystemLabel,
  alternativeOptions,
  displayCppCents,
  displayCppSources,
}: {
  viewId: StrategyViewId
  currentAnnualPoints: number
  currentAnnualDollars: number
  currentAnnualFee: number
  currentBenefitLabels: string[]
  scenarioPortfolio: StrategyPortfolioSummary
  categoryRows: CategoryStrategyRow[]
  recommendedCards: Card[]
  summaryReason: string
  strategyAssumptions: StrategyAssumption[]
  strategyLimitations: StrategyLimitation[]
  ecosystemId?: string
  ecosystemLabel?: string
  alternativeOptions?: EcosystemStrategyOption[]
  displayCppCents: number
  displayCppSources?: StrategyResult["displayCppSources"]
}): StrategyResult {
  return {
    viewId,
    currentAnnualPoints,
    currentAnnualDollars,
    currentAnnualFee,
    currentBenefitLabels,
    maxPotentialAnnualPoints: scenarioPortfolio.annualPoints,
    maxPotentialAnnualDollars: scenarioPortfolio.annualDollars,
    incrementalAnnualPoints: scenarioPortfolio.annualPoints - currentAnnualPoints,
    incrementalAnnualDollars: scenarioPortfolio.annualDollars - currentAnnualDollars,
    netAdditionalFee: scenarioPortfolio.annualFee - currentAnnualFee,
    additionalBenefitLabels: scenarioPortfolio.benefitLabels.filter(
      (label) => !currentBenefitLabels.includes(label)
    ),
    categoryRows,
    recommendedCard: recommendedCards[0] ?? null,
    recommendedCards,
    recommendedPortfolio: scenarioPortfolio,
    ...(ecosystemId ? { ecosystemId } : {}),
    ...(ecosystemLabel ? { ecosystemLabel } : {}),
    ...(alternativeOptions ? { alternativeOptions } : {}),
    summaryReason,
    estimatedValueCurrentDollars: currentAnnualDollars,
    estimatedValueMaxDollars: scenarioPortfolio.annualDollars,
    displayCppCents,
    ...(displayCppSources && Object.keys(displayCppSources).length > 0 ? { displayCppSources } : {}),
    strategyAssumptions,
    strategyLimitations,
  }
}

function computeNextBestCardStrategy(monthlySpend: MonthlySpend, walletCards: Card[]): StrategyResult {
  const assumptionNotes = createAssumptionCollector()
  const currentAnnualPoints = calculateCurrentAnnualPoints(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualDollars = calculateCurrentAnnualDollars(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualFee = getCurrentAnnualFee(walletCards)
  const currentBenefitLabels = getCurrentBenefitLabels(walletCards)
  const candidateEvaluation = evaluateBestCandidate(
    monthlySpend,
    walletCards,
    currentAnnualDollars,
    assumptionNotes
  )
  const recommendedCard = candidateEvaluation.recommendedCard
  const recommendedCards = recommendedCard ? [recommendedCard] : []
  const scenarioCards = recommendedCard ? [...walletCards, recommendedCard] : walletCards
  const scenarioPortfolio = getPortfolioSummary(monthlySpend, scenarioCards, assumptionNotes)
  const categoryRows = buildCategoryRows(monthlySpend, walletCards, scenarioCards, assumptionNotes)

  return buildStrategyResult({
    viewId: "nextBestCard",
    currentAnnualPoints,
    currentAnnualDollars,
    currentAnnualFee,
    currentBenefitLabels,
    scenarioPortfolio,
    categoryRows,
    recommendedCards,
    summaryReason: buildNextBestCardSummaryReason(
      recommendedCard,
      candidateEvaluation.bestGrossIncrementalDollars > 0,
      walletCards.length
    ),
    strategyAssumptions: Array.from(assumptionNotes.values()),
    strategyLimitations: getStrategyLimitations("nextBestCard"),
    displayCppCents: getDisplayCppCents(walletCards, recommendedCards),
    displayCppSources: getDisplayCppSources(walletCards, recommendedCards),
  })
}

function computeBestSingleCardStrategy(monthlySpend: MonthlySpend, walletCards: Card[]): StrategyResult {
  const assumptionNotes = createAssumptionCollector()
  const currentAnnualPoints = calculateCurrentAnnualPoints(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualDollars = calculateCurrentAnnualDollars(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualFee = getCurrentAnnualFee(walletCards)
  const currentBenefitLabels = getCurrentBenefitLabels(walletCards)
  const recommendedCard = evaluateBestSingleCard(monthlySpend, assumptionNotes)
  const recommendedCards = recommendedCard ? [recommendedCard] : []
  const scenarioPortfolio = getPortfolioSummary(monthlySpend, recommendedCards, assumptionNotes)
  const categoryRows = buildCategoryRows(monthlySpend, walletCards, recommendedCards, assumptionNotes)

  return buildStrategyResult({
    viewId: "bestSingleCard",
    currentAnnualPoints,
    currentAnnualDollars,
    currentAnnualFee,
    currentBenefitLabels,
    scenarioPortfolio,
    categoryRows,
    recommendedCards,
    summaryReason: buildBestSingleCardSummaryReason(recommendedCard),
    strategyAssumptions: Array.from(assumptionNotes.values()),
    strategyLimitations: getStrategyLimitations("bestSingleCard"),
    displayCppCents: getDisplayCppCents(walletCards, recommendedCards),
    displayCppSources: getDisplayCppSources(walletCards, recommendedCards),
  })
}

function computeBestEcosystemStrategy(monthlySpend: MonthlySpend, walletCards: Card[]): StrategyResult {
  const assumptionNotes = createAssumptionCollector()
  const currentAnnualPoints = calculateCurrentAnnualPoints(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualDollars = calculateCurrentAnnualDollars(monthlySpend, walletCards, assumptionNotes)
  const currentAnnualFee = getCurrentAnnualFee(walletCards)
  const currentBenefitLabels = getCurrentBenefitLabels(walletCards)
  const rankedOptions = evaluateEcosystemOptions(monthlySpend, walletCards, assumptionNotes)
  const winningOption = rankedOptions[0]
  const recommendedCards = winningOption?.portfolio.cards ?? []
  const scenarioPortfolio = winningOption?.portfolio ?? getPortfolioSummary(monthlySpend, [], assumptionNotes)
  const categoryRows = winningOption?.categoryRows ?? buildCategoryRows(monthlySpend, walletCards, [], assumptionNotes)

  return buildStrategyResult({
    viewId: "bestEcosystem",
    currentAnnualPoints,
    currentAnnualDollars,
    currentAnnualFee,
    currentBenefitLabels,
    scenarioPortfolio,
    categoryRows,
    recommendedCards,
    summaryReason:
      winningOption?.summaryReason ?? "No ecosystem portfolio recommendation is currently available.",
    strategyAssumptions: Array.from(assumptionNotes.values()),
    strategyLimitations: getStrategyLimitations("bestEcosystem"),
    ecosystemId: winningOption?.ecosystemId,
    ecosystemLabel: winningOption?.ecosystemLabel,
    alternativeOptions: rankedOptions.slice(1, 4),
    displayCppCents: getDisplayCppCents(walletCards, recommendedCards),
    displayCppSources: getDisplayCppSources(walletCards, recommendedCards),
  })
}

export function computeStrategyViews(
  monthlySpend: MonthlySpend,
  walletCardIds: string[]
): StrategyPageData {
  const walletCards = walletCardIds
    .map((id) => getCardById(id))
    .filter((c): c is Card => c !== undefined)

  return {
    nextBestCard: computeNextBestCardStrategy(monthlySpend, walletCards),
    bestSingleCard: computeBestSingleCardStrategy(monthlySpend, walletCards),
    bestEcosystem: computeBestEcosystemStrategy(monthlySpend, walletCards),
  }
}

/**
 * Backward-compatible alias for the original single-view strategy page.
 */
export function computeStrategy(
  monthlySpend: MonthlySpend,
  walletCardIds: string[]
): StrategyResult {
  return computeStrategyViews(monthlySpend, walletCardIds).nextBestCard
}
