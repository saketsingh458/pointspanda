import type {
  AnnualFeeMode,
  Card,
  SpendCategoryId,
  StatementCreditFrequency,
  StrategyViewId,
} from "@/lib/types"

export const STRATEGY_TABS: Array<{ id: StrategyViewId; label: string }> = [
  { id: "nextBestCard", label: "Your Next Best Card" },
  { id: "bestSingleCard", label: "Best Single Card Strategy" },
  { id: "bestEcosystem", label: "Best Ecosystem Play" },
]

export const FEE_MODE_OPTIONS: Array<{
  id: AnnualFeeMode
  label: string
  tooltip: string
}> = [
  {
    id: "full",
    label: "Net of Annual Fee",
    tooltip: "Subtract annual fee from rewards value",
  },
  {
    id: "none",
    label: "Rewards Only",
    tooltip: "Ignore annual fees (assume recovered via credits/perks)",
  },
]

export function getStrategyCopy(
  viewId: StrategyViewId,
  feeMode: AnnualFeeMode
) {
  const feeSuffix = feeMode === "none" ? " (rewards only)" : ""
  const base = {
    nextBestCard: {
      scenarioTitle: `Projected Annual Value After Adding Your Next Card${feeSuffix}`,
      rankingNote:
        feeMode === "none"
          ? "This view ranks one new-card additions by portfolio-wide rewards gain. Annual fees are excluded from ranking."
          : "This view ranks one new-card additions by portfolio-wide rewards gain minus the added annual fee.",
      categoryIntro:
        "We compare your current wallet to the wallet you would have after adding the recommended card.",
      detailBadge: "Next best card",
      benefitTitle: "+Additional Key Benefits",
    },
    bestSingleCard: {
      scenarioTitle: `Projected Annual Value With Best Single Card${feeSuffix}`,
      rankingNote:
        feeMode === "none"
          ? "This view ranks one-card setups by annual rewards value, optimized for simplicity. Annual fees are excluded from ranking."
          : "This view ranks one-card setups by annual rewards value minus annual fee, optimized for simplicity.",
      categoryIntro:
        "We compare your current wallet to the strongest one-card setup for your spending profile.",
      detailBadge: "Best single card",
      benefitTitle: "Benefits On This Card",
    },
    bestEcosystem: {
      scenarioTitle: `Projected Annual Value With Best Ecosystem Portfolio${feeSuffix}`,
      rankingNote:
        feeMode === "none"
          ? "This view ranks from-scratch ecosystem portfolios by annual rewards value and shows the next 3 alternatives. Annual fees are excluded from ranking."
          : "This view ranks from-scratch ecosystem portfolios by annual rewards value minus annual fees and shows the next 3 alternatives.",
      categoryIntro:
        "We compare your current wallet to the best card routing inside the recommended ecosystem portfolio.",
      detailBadge: "Best ecosystem",
      benefitTitle: "Combined Portfolio Benefits",
    },
  }
  return base[viewId]
}

export function formatPoints(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

export function formatSpend(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatSignedSpend(n: number): string {
  if (n === 0) return formatSpend(0)
  const prefix = n > 0 ? "+" : "-"
  return `${prefix}${formatSpend(Math.abs(n))}`
}

export function deltaClassName(value: number): string {
  if (value > 0) return "text-success"
  if (value < 0) return "text-destructive"
  return "text-muted-foreground"
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const CATEGORY_KEYWORDS: Record<SpendCategoryId, string[]> = {
  travel: [
    "travel",
    "airline",
    "air",
    "hotel",
    "flight",
    "lounge",
    "global entry",
    "tsa",
    "clear",
    "uber",
    "lyft",
    "rental",
    "trip",
    "baggage",
  ],
  dining: ["dining", "restaurant", "resy", "doordash", "food"],
  groceries: ["grocery", "grocer", "supermarket"],
  gasEv: ["gas", "fuel", "ev", "charging", "transit"],
  streamingEntertainment: [
    "streaming",
    "entertainment",
    "disney",
    "spotify",
    "hulu",
    "youtube",
  ],
  drugstores: ["drugstore", "pharmacy", "medicine"],
  rentMortgage: ["rent", "mortgage", "housing"],
  other: [],
}

export function classifyToSpendCategory(label: string): SpendCategoryId {
  const normalized = label.toLowerCase()
  for (const categoryId of [
    "travel",
    "dining",
    "groceries",
    "gasEv",
    "streamingEntertainment",
    "drugstores",
    "rentMortgage",
  ] as SpendCategoryId[]) {
    if (
      CATEGORY_KEYWORDS[categoryId].some((keyword) =>
        normalized.includes(keyword)
      )
    ) {
      return categoryId
    }
  }
  return "other"
}

export function formatFrequency(freq: StatementCreditFrequency): string {
  if (freq === "semi_annual") return "Semi-annual"
  if (freq === "one_time") return "One-time"
  if (freq === "per_instance") return "Per instance"
  if (freq.startsWith("every_") && freq.endsWith("_years")) {
    const years = freq.replace("every_", "").replace("_years", "")
    return `Every ${years} years`
  }
  return freq.charAt(0).toUpperCase() + freq.slice(1)
}

export function spendCategoryLabel(categoryId: SpendCategoryId): string {
  if (categoryId === "gasEv") return "Gas & EV"
  if (categoryId === "streamingEntertainment") return "Streaming & Entertainment"
  if (categoryId === "rentMortgage") return "Rent & Mortgage"
  return categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
}

export function compactCardName(card: Card | null | undefined): string {
  if (!card) return ""
  const fullName = card.name.trim()
  const issuer = card.issuer?.trim()
  if (!issuer) return fullName

  const issuerPattern = escapeRegExp(issuer)
  const withoutPrefix = fullName.replace(
    new RegExp(`^${issuerPattern}[\\s:-]+`, "i"),
    ""
  )
  const withoutSuffix = withoutPrefix.replace(
    new RegExp(`\\s+from\\s+${issuerPattern}$`, "i"),
    ""
  )
  return withoutSuffix.length >= 4 ? withoutSuffix : fullName
}
