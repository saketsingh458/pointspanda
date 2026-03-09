"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  CircleDollarSign,
  Fuel,
  Home,
  Pill,
  Plane,
  ShoppingCart,
  Tv,
  UtensilsCrossed,
  Building2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { AppFooter } from "@/components/app-footer"
import { CardDetailDialog } from "@/components/card-detail-dialog"
import { PointsPandaLogo } from "@/components/points-panda-logo"
import { StepIndicator } from "@/components/step-indicator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePointPath } from "@/contexts/pointpath-context"
import { computeStrategyViews } from "@/lib/strategy"
import type {
  Card as CreditCard,
  EcosystemStrategyOption,
  SpendCategoryId,
  StrategyResult,
  StrategyViewId,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const CATEGORY_ICONS: Record<SpendCategoryId, LucideIcon> = {
  travel: Plane,
  dining: UtensilsCrossed,
  groceries: ShoppingCart,
  gasEv: Fuel,
  streamingEntertainment: Tv,
  drugstores: Pill,
  rentMortgage: Building2,
  other: CircleDollarSign,
}

const STRATEGY_TABS: Array<{ id: StrategyViewId; label: string }> = [
  { id: "nextBestCard", label: "Your Next Best Card" },
  { id: "bestSingleCard", label: "Best Single Card Strategy" },
  { id: "bestEcosystem", label: "Best Ecosystem Play" },
]

const STRATEGY_COPY: Record<
  StrategyViewId,
  {
    scenarioTitle: string
    rankingNote: string
    categoryIntro: string
    detailBadge: string
    benefitTitle: string
  }
> = {
  nextBestCard: {
    scenarioTitle: "Projected Annual Value After Adding Your Next Card",
    rankingNote:
      "This view ranks one new-card additions by portfolio-wide rewards gain minus the added annual fee.",
    categoryIntro:
      "We compare your current wallet to the wallet you would have after adding the recommended card.",
    detailBadge: "Next best card",
    benefitTitle: "+Additional Key Benefits",
  },
  bestSingleCard: {
    scenarioTitle: "Projected Annual Value With Best Single Card",
    rankingNote:
      "This view ranks one-card setups by annual rewards value minus annual fee, optimized for simplicity.",
    categoryIntro:
      "We compare your current wallet to the strongest one-card setup for your spending profile.",
    detailBadge: "Best single card",
    benefitTitle: "Benefits On This Card",
  },
  bestEcosystem: {
    scenarioTitle: "Projected Annual Value With Best Ecosystem Portfolio",
    rankingNote:
      "This view ranks from-scratch ecosystem portfolios by annual rewards value minus annual fees and shows the next 3 alternatives.",
    categoryIntro:
      "We compare your current wallet to the best card routing inside the recommended ecosystem portfolio.",
    detailBadge: "Best ecosystem",
    benefitTitle: "Combined Portfolio Benefits",
  },
}

function formatPoints(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

function formatSpend(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatSignedSpend(n: number): string {
  if (n === 0) return formatSpend(0)
  const prefix = n > 0 ? "+" : "-"
  return `${prefix}${formatSpend(Math.abs(n))}`
}

function formatCpp(cents: number): string {
  return (cents / 100).toFixed(2)
}

function getCppBaselineText(strategy: StrategyResult): string {
  const cpp = strategy.displayCppCents
  if (cpp == null) return ""
  const primary = formatCpp(cpp)
  const cardsToInspect: CreditCard[] = []
  if (strategy.recommendedCard) {
    cardsToInspect.push(strategy.recommendedCard)
  }
  if (strategy.recommendedCards && strategy.recommendedCards.length > 0) {
    cardsToInspect.push(...strategy.recommendedCards)
  }
  if (strategy.recommendedPortfolio?.cards && strategy.recommendedPortfolio.cards.length > 0) {
    cardsToInspect.push(...strategy.recommendedPortfolio.cards)
  }

  const poolingNote = cardsToInspect.find(
    (card) => card.pointsTransferEligibility === "pooling_only" && card.transferEligibilityNote
  )?.transferEligibilityNote

  if (poolingNote) {
    return `Portfolio values use each card's assumed cpp; showing ${primary} cpp as a reference. ${poolingNote}`
  }

  return `Portfolio values use each card's assumed cpp; showing ${primary} cpp as a reference`
}

function deltaClassName(value: number): string {
  if (value > 0) return "text-success"
  if (value < 0) return "text-destructive"
  return "text-muted-foreground"
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function compactCardName(card: CreditCard | null | undefined): string {
  if (!card) return ""
  const fullName = card.name.trim()
  const issuer = card.issuer?.trim()
  if (!issuer) return fullName

  const issuerPattern = escapeRegExp(issuer)
  const withoutPrefix = fullName.replace(new RegExp(`^${issuerPattern}[\\s:-]+`, "i"), "")
  const withoutSuffix = withoutPrefix.replace(new RegExp(`\\s+from\\s+${issuerPattern}$`, "i"), "")
  return withoutSuffix.length >= 4 ? withoutSuffix : fullName
}

function RecommendedCardImage({ card }: { card: { name: string; imageUrl?: string } }) {
  const [error, setError] = useState(false)
  const hasImage = !!card.imageUrl && !error

  return (
    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
      {hasImage ? (
        <Image
          src={card.imageUrl!}
          alt={card.name}
          fill
          className="object-cover object-center"
          sizes="128px"
          onError={() => setError(true)}
        />
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: "12px 12px",
            }}
          />
          <div className="absolute left-2 top-2 h-5 w-7 rounded-sm bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
          <p className="absolute inset-x-2 bottom-2 truncate text-[10px] font-medium text-white/80">
            {card.name}
          </p>
        </>
      )}
    </div>
  )
}

function PortfolioCardButton({
  card,
  onOpen,
}: {
  card: CreditCard
  onOpen: (card: CreditCard) => void
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-4 rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => onOpen(card)}
    >
      <RecommendedCardImage card={card} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{card.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {card.synergyEcosystem ?? card.rewardCurrency ?? card.issuer ?? "Card"}
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          {formatSpend(card.annualFee)} annual fee
        </p>
      </div>
    </button>
  )
}

function StrategySummarySection({ strategy }: { strategy: StrategyResult }) {
  const copy = STRATEGY_COPY[strategy.viewId]
  const highlightedBenefits =
    strategy.viewId === "bestEcosystem"
      ? strategy.recommendedPortfolio?.benefitLabels ?? []
      : strategy.viewId === "bestSingleCard"
        ? strategy.recommendedPortfolio?.benefitLabels ?? []
        : strategy.additionalBenefitLabels

  return (
    <section className="mb-14">
      <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-4">
        <Card className="flex-1 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {copy.scenarioTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                {formatSpend(strategy.maxPotentialAnnualDollars)}
              </p>
              {strategy.incrementalAnnualDollars !== 0 && (
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1",
                    strategy.incrementalAnnualDollars > 0
                      ? "bg-success text-success-foreground hover:bg-success"
                      : "bg-destructive text-white hover:bg-destructive"
                  )}
                >
                  {formatSignedSpend(strategy.incrementalAnnualDollars)}/yr
                </Badge>
              )}
            </div>
            {strategy.displayCppCents != null && (
              <p className="text-sm font-medium text-foreground">
                {getCppBaselineText(strategy)}:{" "}
                {formatPoints(strategy.maxPotentialAnnualPoints)} pts/yr
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">{strategy.summaryReason}</p>
            <p className="text-xs text-muted-foreground">{copy.rankingNote}</p>
            {strategy.netAdditionalFee !== 0 && (
              <p className="text-sm font-medium text-foreground">
                Annual fee change vs current:{" "}
                <span className={deltaClassName(strategy.netAdditionalFee)}>
                  {formatSignedSpend(strategy.netAdditionalFee)}
                </span>
              </p>
            )}
            {highlightedBenefits.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {copy.benefitTitle}
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlightedBenefits.map((label) => (
                    <Badge
                      key={label}
                      variant={strategy.viewId === "nextBestCard" ? "outline" : "secondary"}
                      className={cn(
                        "rounded-full px-3 py-1",
                        strategy.viewId === "nextBestCard" && "border-primary/40 text-primary"
                      )}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex shrink-0 justify-center px-2">
          <span className="rounded-full bg-muted px-4 py-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            vs.
          </span>
        </div>

        <Card className="flex-1 border-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Estimated Annual Value
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {formatSpend(strategy.currentAnnualDollars)}
            </p>
            {strategy.displayCppCents != null && (
              <p className="text-sm font-medium text-foreground">
                {getCppBaselineText(strategy)}:{" "}
                {formatPoints(strategy.currentAnnualPoints)} pts/yr
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              From your current wallet cards and estimated spend.
            </p>
            <p className="text-sm font-medium text-foreground">
              Total annual fee currently being paid: {formatSpend(strategy.currentAnnualFee)}
            </p>
            {strategy.currentBenefitLabels.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Key Existing Benefits
                </p>
                <div className="flex flex-wrap gap-2">
                  {strategy.currentBenefitLabels.map((label) => (
                    <Badge key={label} variant="secondary" className="rounded-full px-3 py-1">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function CategoryTableSection({
  strategy,
  monthlySpend,
  onOpenCardDetails,
}: {
  strategy: StrategyResult
  monthlySpend: Record<SpendCategoryId, number>
  onOpenCardDetails: (card: CreditCard) => void
}) {
  const copy = STRATEGY_COPY[strategy.viewId]
  const recommendedCardIds = new Set(strategy.recommendedCards.map((card) => card.id))

  return (
    <section className="mb-14">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Category-by-Category Strategy</h2>
      <p className="mb-4 text-sm text-muted-foreground">{copy.categoryIntro}</p>
      <Card className="overflow-hidden border-border/70">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-11 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Spend
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Current Best
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Scenario Best
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Annual Value Change
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategy.categoryRows.map((row) => {
                const Icon = CATEGORY_ICONS[row.categoryId]
                const annualSpend = (monthlySpend[row.categoryId] ?? 0) * 12
                const isRecommendedRow =
                  !!row.suggestedCard &&
                  recommendedCardIds.has(row.suggestedCard.id) &&
                  row.incrementalAnnualDollars > 0

                return (
                  <TableRow
                    key={row.categoryId}
                    className={
                      isRecommendedRow
                        ? "bg-primary/5 transition-colors hover:bg-primary/10"
                        : "transition-colors hover:bg-muted/30"
                    }
                  >
                    <TableCell className="py-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
                        {row.categoryLabel}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 tabular-nums text-muted-foreground">
                      {annualSpend > 0 ? `${formatSpend(annualSpend)}/yr` : "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      {row.currentBestCard ? (
                        <button
                          type="button"
                          title={row.currentBestCard.name}
                          className="inline-flex w-full max-w-[220px] min-w-0 items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          onClick={() => onOpenCardDetails(row.currentBestCard!)}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {compactCardName(row.currentBestCard)}
                          </span>
                          <span className="shrink-0">({row.currentMultiplier}x)</span>
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {row.suggestedCard ? (
                        <button
                          type="button"
                          title={row.suggestedCard.name}
                          className={cn(
                            "inline-flex w-full max-w-[220px] min-w-0 items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            isRecommendedRow
                              ? "bg-primary/15 text-primary hover:bg-primary/20"
                              : row.incrementalAnnualDollars < 0
                                ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
                                : row.isOptimized
                                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                  : "bg-muted text-foreground hover:bg-muted/80"
                          )}
                          onClick={() => onOpenCardDetails(row.suggestedCard!)}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {compactCardName(row.suggestedCard)}
                          </span>
                          <span className="shrink-0">
                            ({row.suggestedMultiplier}x
                            {isRecommendedRow && strategy.viewId === "nextBestCard" ? " • Pick" : ""})
                          </span>
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className={cn("font-medium", deltaClassName(row.incrementalAnnualDollars))}>
                        {row.incrementalAnnualDollars === 0
                          ? "—"
                          : formatSignedSpend(row.incrementalAnnualDollars)}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-primary/5 font-semibold hover:bg-primary/5">
                <TableCell colSpan={4} className="font-semibold">
                  Total annual value change vs current
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    deltaClassName(strategy.incrementalAnnualDollars)
                  )}
                >
                  {strategy.incrementalAnnualDollars === 0
                    ? "No change"
                    : formatSignedSpend(strategy.incrementalAnnualDollars)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>
    </section>
  )
}

function SingleCardRecommendationSection({
  strategy,
  onOpenCardDetails,
}: {
  strategy: StrategyResult
  onOpenCardDetails: (card: CreditCard) => void
}) {
  const card = strategy.recommendedCard
  const netAnnualImpact = strategy.incrementalAnnualDollars - strategy.netAdditionalFee
  const usageRows =
    card == null
      ? []
      : strategy.categoryRows
          .filter(
            (row) =>
              row.suggestedCard?.id === card.id &&
              row.incrementalAnnualDollars > 0
          )
          .sort(
            (a, b) =>
              b.incrementalAnnualDollars - a.incrementalAnnualDollars
          )
  const topUsageLabels = usageRows.slice(0, 3).map((row) => row.categoryLabel)
  if (!card) return null

  return (
    <section>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpenCardDetails(card)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onOpenCardDetails(card)
          }
        }}
        className="overflow-hidden border-2 border-primary/20 shadow-xl transition-shadow hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start gap-4">
            <RecommendedCardImage card={card} />
            <div className="min-w-0 flex flex-wrap items-center gap-3">
              <CardTitle className="text-xl font-bold text-foreground md:text-2xl">
                {card.name}
              </CardTitle>
              <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                {STRATEGY_COPY[strategy.viewId].detailBadge}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription className="text-base leading-relaxed text-muted-foreground">
            {strategy.summaryReason}
          </CardDescription>
          {topUsageLabels.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Use this card for:</span>{" "}
              {topUsageLabels.join(", ")}
              {usageRows.length > topUsageLabels.length ? " and other categories." : "."}
            </p>
          )}
          <div className="flex flex-wrap gap-6 border-y border-border py-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estimated extra rewards (before fee)
              </span>
              <span className={cn("text-lg font-semibold", deltaClassName(strategy.incrementalAnnualDollars))}>
                {formatSignedSpend(strategy.incrementalAnnualDollars)}/yr
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Annual fee
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatSpend(card.annualFee)} annual fee
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Net annual impact (after fee)
              </span>
              <span className={cn("text-lg font-semibold", deltaClassName(netAnnualImpact))}>
                {formatSignedSpend(netAnnualImpact)}/yr
              </span>
            </div>
            {card.signUpBonus != null && (
              <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sign-up bonus
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {formatPoints(card.signUpBonus)} points
                </span>
              </div>
            )}
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 w-full gap-2 text-base font-semibold md:w-auto md:min-w-[200px]"
          >
            <Link href={card.applyUrl ?? "#"} onClick={(e) => e.stopPropagation()}>
              Apply Now
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

function EcosystemOptionCard({
  option,
  rank,
  onOpenCardDetails,
}: {
  option: EcosystemStrategyOption
  rank: number
  onOpenCardDetails: (card: CreditCard) => void
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Option {rank}
            </p>
            <CardTitle className="mt-1 text-lg">{option.ecosystemLabel}</CardTitle>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {option.portfolio.cards.length} cards
          </Badge>
        </div>
        <CardDescription>{option.summaryReason}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net annual value
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatSpend(option.portfolio.netAnnualValue)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total annual fee
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatSpend(option.portfolio.annualFee)}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {option.portfolio.cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => onOpenCardDetails(card)}
            >
              <span className="truncate pr-4 font-medium text-foreground">{card.name}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatSpend(card.annualFee)}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EcosystemRecommendationSection({
  strategy,
  onOpenCardDetails,
}: {
  strategy: StrategyResult
  onOpenCardDetails: (card: CreditCard) => void
}) {
  const portfolio = strategy.recommendedPortfolio
  if (!portfolio) return null

  return (
    <section className="space-y-8">
      <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl font-bold text-foreground md:text-3xl">
              {strategy.ecosystemLabel ?? "Best ecosystem portfolio"}
            </CardTitle>
            <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
              {STRATEGY_COPY.bestEcosystem.detailBadge}
            </Badge>
          </div>
          <CardDescription className="text-base leading-relaxed text-muted-foreground">
            {strategy.summaryReason}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Net annual value
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formatSpend(portfolio.netAnnualValue)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rewards value
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formatSpend(portfolio.annualDollars)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total annual fee
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formatSpend(portfolio.annualFee)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Portfolio size
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{portfolio.cards.length}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended portfolio
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {portfolio.cards.map((card) => (
                <PortfolioCardButton key={card.id} card={card} onOpen={onOpenCardDetails} />
              ))}
            </div>
          </div>

          {portfolio.benefitLabels.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Combined benefits received
              </p>
              <div className="flex flex-wrap gap-2">
                {portfolio.benefitLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="rounded-full px-3 py-1">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(strategy.alternativeOptions?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Next 3 ecosystem options</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These are the strongest alternatives after the top ecosystem portfolio.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {strategy.alternativeOptions?.map((option, index) => (
              <EcosystemOptionCard
                key={option.ecosystemId}
                option={option}
                rank={index + 2}
                onOpenCardDetails={onOpenCardDetails}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function FootnotesSection({ strategy }: { strategy: StrategyResult }) {
  return (
    <>
      {strategy.strategyAssumptions.length > 0 && (
        <section className="mt-14">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assumptions used
            </p>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-sm text-muted-foreground">
              {strategy.strategyAssumptions.map((assumption) => (
                <li key={assumption.id}>
                  <span className="font-medium text-foreground">{assumption.title}:</span>{" "}
                  {assumption.assumption}
                  {assumption.whyItMatters ? (
                    <span className="block text-xs text-muted-foreground/90">
                      Why this matters: {assumption.whyItMatters}
                    </span>
                  ) : null}
                  {assumption.sourceLabel ? (
                    <span className="block text-xs text-muted-foreground/90">
                      Source: {assumption.sourceLabel}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {strategy.strategyLimitations.length > 0 && (
        <section className="mt-4">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Strategy limitations
            </p>
            <ul className="mt-3 list-disc space-y-3 pl-5 text-sm text-muted-foreground">
              {strategy.strategyLimitations.map((limitation) => (
                <li key={limitation.id}>
                  <span className="font-medium text-foreground">{limitation.title}:</span>{" "}
                  {limitation.limitation}
                  {limitation.whyItMatters ? (
                    <span className="block text-xs text-muted-foreground/90">
                      Why this matters: {limitation.whyItMatters}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}

export default function StrategyPage() {
  const { monthlySpend, walletCardIds } = usePointPath()
  const strategyViews = useMemo(
    () => computeStrategyViews(monthlySpend, walletCardIds),
    [monthlySpend, walletCardIds]
  )
  const [activeView, setActiveView] = useState<StrategyViewId>("nextBestCard")
  const [detailCard, setDetailCard] = useState<CreditCard | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const strategy = strategyViews[activeView]

  const totalMonthlySpend = Object.values(monthlySpend).reduce((a, b) => a + b, 0)
  const showEmptyState = totalMonthlySpend === 0

  function openCardDetails(card: CreditCard | null | undefined) {
    if (!card) return
    setDetailCard(card)
    setDetailOpen(true)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-10">
        <PointsPandaLogo />
        <StepIndicator currentStep={3} />
        <div className="flex w-20 justify-end">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Your Strategy
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Compare your next best card, your best one-card setup, and the best ecosystem portfolio for your spending profile.
          </p>
        </div>

        <section className="mb-10">
          <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/40 p-2">
            {STRATEGY_TABS.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeView === tab.id ? "default" : "ghost"}
                className="rounded-xl"
                onClick={() => setActiveView(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </section>

        {showEmptyState ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">
                Add your spending on the intake page to see your strategy.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-6 gap-2">
                <Link href="/intake">
                  Go to Intake
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <StrategySummarySection strategy={strategy} />
            <CategoryTableSection
              strategy={strategy}
              monthlySpend={monthlySpend}
              onOpenCardDetails={openCardDetails}
            />
            {strategy.viewId === "bestEcosystem" ? (
              <EcosystemRecommendationSection
                strategy={strategy}
                onOpenCardDetails={openCardDetails}
              />
            ) : (
              <SingleCardRecommendationSection
                strategy={strategy}
                onOpenCardDetails={openCardDetails}
              />
            )}
            <FootnotesSection strategy={strategy} />
          </>
        )}

        <div className="mt-12 flex justify-end">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="size-4" aria-hidden />
              Back to Home
            </Link>
          </Button>
        </div>
      </main>

      <CardDetailDialog
        card={detailCard}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailCard(null)
        }}
      />

      <AppFooter />
    </div>
  )
}
