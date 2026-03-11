import { CATEGORY_LABELS } from "@/lib/cards"
import { SPEND_CATEGORIES, type Card, type CategoryEarnRate, type SpendCategoryId } from "@/lib/types"

export const COMPARE_MIN_CARDS = 2
export const COMPARE_MAX_CARDS = 3

export interface CompareCellValue {
  primary: string | null
  secondary?: string | null
  items?: string[]
}

export interface CompareRow {
  id: string
  label: string
  values: CompareCellValue[]
}

export interface CompareSection {
  id: string
  title: string
  rows: CompareRow[]
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const POINTS_FORMATTER = new Intl.NumberFormat("en-US")

function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(amount)
}

function formatPoints(amount: number): string {
  return POINTS_FORMATTER.format(amount)
}

function formatCpp(cents: number): string {
  const cpp = cents / 100
  return `${Number.isInteger(cpp) ? cpp.toFixed(0) : cpp.toFixed(1)}c/pt`
}

function formatCapPeriod(period?: string): string | null {
  if (!period) return null
  if (period === "annual") return "yr"
  if (period === "quarterly") return "qtr"
  if (period === "monthly") return "mo"
  return period
}

function frequencyMultiplier(freq: string): number {
  const normalized = freq.trim().toLowerCase()
  if (normalized === "yearly") return 1
  if (normalized === "monthly") return 12
  if (normalized === "quarterly") return 4
  if (normalized === "semi_annual") return 2
  if (normalized === "one_time" || normalized === "per_instance") return 1

  const everyYears = normalized.match(/^every_(\d+)_years$/)
  if (!everyYears) return 1

  const years = Number(everyYears[1])
  return years > 0 ? 1 / years : 1
}

function annualizeCreditAmount(amount: number, frequency: string): number {
  return amount * frequencyMultiplier(frequency)
}

function isMeaningfulWelcomeOffer(card: Card): boolean {
  return Boolean(
    (card.signUpBonus ?? 0) > 0 ||
      (card.signUpBonusSpendRequirement ?? 0) > 0 ||
      (card.signUpBonusTimeframeMonths ?? 0) > 0
  )
}

function formatCapLabel(rate: CategoryEarnRate): string | null {
  if (rate.capAmount == null) return null
  const period = formatCapPeriod(rate.capPeriod)
  return `${formatCurrency(rate.capAmount)}${period ? `/${period}` : ""} cap`
}

function formatEarnRateDetail(rate: CategoryEarnRate): string {
  const parts = [`${rate.multiplier}x`, rate.channel]

  if (rate.travelSubtype && rate.travelSubtype !== "general") {
    parts.push(rate.travelSubtype)
  }

  if (rate.bookingChannel === "portal") {
    parts.push("portal")
  } else if (rate.bookingChannel === "direct") {
    parts.push("direct")
  }

  if (rate.requiresPortal) {
    parts.push("issuer portal required")
  }

  const capLabel = formatCapLabel(rate)
  if (capLabel) parts.push(capLabel)

  return parts.join(" · ")
}

function getAnnualCreditsValue(card: Card): CompareCellValue {
  const credits = card.statementCredits ?? []
  if (credits.length === 0) return { primary: null }

  const total = credits.reduce((sum, credit) => {
    return sum + annualizeCreditAmount(credit.amount, credit.frequency)
  }, 0)

  const items = credits.map((credit) => {
    const amount = annualizeCreditAmount(credit.amount, credit.frequency)
    return `${credit.name}: ${formatCurrency(Math.round(amount))}/yr`
  })

  return {
    primary: formatCurrency(Math.round(total)),
    secondary: `${credits.length} credit${credits.length === 1 ? "" : "s"}`,
    items,
  }
}

function getTransferPartnersValue(card: Card): CompareCellValue {
  const partners = card.transferPartners ?? []
  const eligibility = card.pointsTransferEligibility
  const note = card.transferEligibilityNote

  if (eligibility === "none") {
    return {
      primary: "No transfer to partners",
      secondary: null,
      items: [],
    }
  }

  if (eligibility === "pooling_only" && note) {
    return {
      primary: note,
      secondary: null,
      items: [],
    }
  }

  if (eligibility === "direct") {
    return {
      primary: "Direct transfer",
      secondary: partners.length > 0 ? `${partners.length} partner${partners.length === 1 ? "" : "s"}` : null,
      items: partners.map((partner) => `${partner.name} (${partner.ratio})`),
    }
  }

  if (partners.length === 0) return { primary: null }
  return {
    primary: `${partners.length}`,
    secondary: partners.length === 1 ? "transfer partner" : "transfer partners",
    items: partners.map((partner) => `${partner.name} (${partner.ratio})`),
  }
}

function getBenefitsValue(card: Card): CompareCellValue {
  if (card.benefits.length > 0) {
    return {
      primary: `${card.benefits.length}`,
      secondary: card.benefits.length === 1 ? "benefit" : "benefits",
      items: card.benefits.slice(0, 6),
    }
  }

  if (card.developerNotes) {
    return {
      primary: "Notes available",
      items: [card.developerNotes],
    }
  }

  return { primary: null }
}

function getOverviewValue(
  card: Card,
  key: "issuer" | "rewardCurrency" | "synergyEcosystem"
): CompareCellValue {
  const value = card[key]
  return { primary: value ?? null }
}

function getWelcomeOfferValue(card: Card): CompareCellValue {
  if (!isMeaningfulWelcomeOffer(card)) return { primary: null }

  const requirement =
    card.signUpBonusSpendRequirement != null && card.signUpBonusTimeframeMonths != null
      ? `Spend ${formatCurrency(card.signUpBonusSpendRequirement)} in ${card.signUpBonusTimeframeMonths} month${
          card.signUpBonusTimeframeMonths === 1 ? "" : "s"
        }`
      : null

  return {
    primary: card.signUpBonus ? `${formatPoints(card.signUpBonus)} pts` : "Offer available",
    secondary: requirement,
  }
}

function getPointValue(card: Card, key: keyof Pick<Card, "pointsValueNerdWalletCents" | "pointsValuePointsGuyCents" | "pointsValueBankrateCents" | "pointsValueCreditKarmaCents" | "pointsValueAssumedCents">): CompareCellValue {
  const value = card[key] as number | undefined
  return { primary: value != null ? formatCpp(value) : null }
}

function getEarningValue(card: Card, categoryId: SpendCategoryId): CompareCellValue {
  const details = card.categoryEarnDetails?.[categoryId] ?? []

  if (details.length > 0) {
    return {
      primary: `${card.categoryMultipliers[categoryId] ?? card.baseRate ?? 0}x`,
      secondary: `${details.length} earning path${details.length === 1 ? "" : "s"}`,
      items: details.map(formatEarnRateDetail),
    }
  }

  const baseRate = categoryId === "other" ? (card.baseRate ?? card.categoryMultipliers.other ?? 0) : card.categoryMultipliers[categoryId]
  return { primary: baseRate > 0 ? `${baseRate}x` : null }
}

export function getCompareCards(cards: Card[], compareCardIds: string[]): Card[] {
  if (compareCardIds.length === 0) return []

  const byId = new Map(cards.map((card) => [card.id, card]))
  return compareCardIds
    .map((id) => byId.get(id))
    .filter((card): card is Card => card !== undefined)
    .slice(0, COMPARE_MAX_CARDS)
}

export function buildCompareSections(cards: Card[]): CompareSection[] {
  return [
    {
      id: "overview",
      title: "Snapshot",
      rows: [
        {
          id: "annual-fee",
          label: "Annual fee",
          values: cards.map((card) => ({ primary: formatCurrency(card.annualFee) })),
        },
        {
          id: "issuer",
          label: "Issuer",
          values: cards.map((card) => getOverviewValue(card, "issuer")),
        },
        {
          id: "ecosystem",
          label: "Ecosystem",
          values: cards.map((card) => getOverviewValue(card, "synergyEcosystem")),
        },
        {
          id: "reward-currency",
          label: "Reward currency",
          values: cards.map((card) => getOverviewValue(card, "rewardCurrency")),
        },
      ],
    },
    {
      id: "welcome-offer",
      title: "Welcome Offer",
      rows: [
        {
          id: "welcome-offer-row",
          label: "Bonus",
          values: cards.map((card) => getWelcomeOfferValue(card)),
        },
      ],
    },
    {
      id: "point-value",
      title: "Point Value",
      rows: [
        ...(cards.some((c) => c.pointsValueNerdWalletCents != null)
          ? [{ id: "point-nerdwallet" as const, label: "NerdWallet" as const, values: cards.map((card) => getPointValue(card, "pointsValueNerdWalletCents")) }]
          : []),
        ...(cards.some((c) => c.pointsValuePointsGuyCents != null)
          ? [{ id: "point-pointsguy" as const, label: "The Points Guy" as const, values: cards.map((card) => getPointValue(card, "pointsValuePointsGuyCents")) }]
          : []),
        ...(cards.some((c) => c.pointsValueBankrateCents != null)
          ? [{ id: "point-bankrate" as const, label: "Bankrate" as const, values: cards.map((card) => getPointValue(card, "pointsValueBankrateCents")) }]
          : []),
        ...(cards.some((c) => c.pointsValueCreditKarmaCents != null)
          ? [{ id: "point-creditkarma" as const, label: "Credit Karma" as const, values: cards.map((card) => getPointValue(card, "pointsValueCreditKarmaCents")) }]
          : []),
        ...(cards.some((c) => c.pointsValueAssumedCents != null)
          ? [{ id: "point-assumed" as const, label: "Assumed (for estimates)" as const, values: cards.map((card) => getPointValue(card, "pointsValueAssumedCents")) }]
          : []),
      ],
    },
    {
      id: "earn-rates",
      title: "Earning Rates",
      rows: SPEND_CATEGORIES.map((categoryId) => ({
        id: `earn-${categoryId}`,
        label: CATEGORY_LABELS[categoryId],
        values: cards.map((card) => getEarningValue(card, categoryId)),
      })),
    },
    {
      id: "credits",
      title: "Credits",
      rows: [
        {
          id: "credits-total",
          label: "Annualized credits",
          values: cards.map((card) => getAnnualCreditsValue(card)),
        },
      ],
    },
    {
      id: "transfer-partners",
      title: "Transfer Partners",
      rows: [
        {
          id: "partners-row",
          label: "Partner list",
          values: cards.map((card) => getTransferPartnersValue(card)),
        },
      ],
    },
    {
      id: "benefits",
      title: "Benefits & Notes",
      rows: [
        {
          id: "benefits-row",
          label: "Highlights",
          values: cards.map((card) => getBenefitsValue(card)),
        },
      ],
    },
  ]
}
