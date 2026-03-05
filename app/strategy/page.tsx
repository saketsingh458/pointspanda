"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Home,
  UtensilsCrossed,
  Plane,
  ShoppingCart,
  Fuel,
  Tv,
  Pill,
  Building2,
  CircleDollarSign,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Card as CreditCard, SpendCategoryId } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsPandaLogo } from "@/components/points-panda-logo"
import { AppFooter } from "@/components/app-footer"
import { StepIndicator } from "@/components/step-indicator"
import { CardDetailDialog } from "@/components/card-detail-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState } from "react"
import { usePointPath } from "@/contexts/pointpath-context"
import { computeStrategy } from "@/lib/strategy"

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

function formatCpp(cents: number): string {
  return (cents / 100).toFixed(2)
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
  if (!card.imageUrl || error) return null
  return (
    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      <Image
        src={card.imageUrl}
        alt={card.name}
        fill
        className="object-cover object-center"
        sizes="128px"
        onError={() => setError(true)}
      />
    </div>
  )
}

export default function StrategyPage() {
  const { monthlySpend, walletCardIds } = usePointPath()
  const strategy = computeStrategy(monthlySpend, walletCardIds)
  const recommendedCardId = strategy.recommendedCard?.id ?? null
  const netAnnualImpact = strategy.incrementalAnnualDollars - strategy.netAdditionalFee
  const [detailCard, setDetailCard] = useState<CreditCard | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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

      <main className="mx-auto flex flex-1 flex-col w-full max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Your Optimized Strategy
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Here is your best next-card strategy based on net annual value from your spending profile.
          </p>
        </div>

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
            {/* 1. Top Summary Cards (Recommended Card vs. Current) */}
            <section className="mb-14">
              <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-4">
                <Card className="flex-1 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Annual Value With Recommended Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <p className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                        {formatSpend(strategy.maxPotentialAnnualDollars)}
                      </p>
                      {strategy.incrementalAnnualDollars > 0 && (
                        <Badge className="rounded-full bg-success px-3 py-1 text-success-foreground hover:bg-success">
                          +{formatSpend(strategy.incrementalAnnualDollars)}/yr
                        </Badge>
                      )}
                    </div>
                    {strategy.displayCppCents != null && strategy.maxPotentialAnnualPoints != null && (
                      <p className="text-sm font-medium text-foreground">
                        At {formatCpp(strategy.displayCppCents)} cpp baseline: {formatPoints(strategy.maxPotentialAnnualPoints)} pts/yr
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {strategy.summaryReason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Recommendation ranking compares portfolio-wide rewards gain minus added annual fee.
                    </p>
                    {strategy.recommendedCard && strategy.netAdditionalFee > 0 && (
                      <p className="text-sm font-medium text-foreground">
                        Net additional fee: +${strategy.netAdditionalFee}
                      </p>
                    )}
                    {strategy.additionalBenefitLabels.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          +Additional Key Benefits
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {strategy.additionalBenefitLabels.map((label) => (
                            <Badge
                              key={label}
                              variant="outline"
                              className="rounded-full border-primary/40 px-3 py-1 text-primary"
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
                    {strategy.displayCppCents != null && strategy.currentAnnualPoints != null && (
                      <p className="text-sm font-medium text-foreground">
                        At {formatCpp(strategy.displayCppCents)} cpp baseline: {formatPoints(strategy.currentAnnualPoints)} pts/yr
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      From your wallet cards and estimated spend.
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      Total annual fee currently being paid: ${strategy.currentAnnualFee}
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

            {/* 2. Category-by-Category Strategy Table */}
            <section className="mb-14">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Category-by-Category Strategy
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                We show how each category routes before vs after the selected recommendation. Rows marked{" "}
                <span className="font-medium text-primary">Recommended pick</span> are what drive the
                uplift from adding that card, and the recommendation itself is ranked by total
                portfolio net value after annual fee.
              </p>
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
                        Suggested
                      </TableHead>
                      <TableHead className="h-11 whitespace-nowrap text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Incremental Annual Value
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategy.categoryRows.map((row) => {
                      const Icon = CATEGORY_ICONS[row.categoryId]
                      const annualSpend = (monthlySpend[row.categoryId] ?? 0) * 12
                      const isRecommendedRow =
                        row.suggestedCard?.id === recommendedCardId && row.incrementalAnnualDollars > 0
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
                            {annualSpend > 0 ? formatSpend(annualSpend) + "/yr" : "—"}
                          </TableCell>
                          <TableCell className="py-3">
                            {row.currentBestCard
                              ? (
                                <button
                                  type="button"
                                  title={row.currentBestCard.name}
                                  className="inline-flex w-full max-w-[220px] min-w-0 items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  onClick={() => openCardDetails(row.currentBestCard)}
                                >
                                  <span className="min-w-0 flex-1 truncate">
                                    {compactCardName(row.currentBestCard)}
                                  </span>
                                  <span className="shrink-0">({row.currentMultiplier}x)</span>
                                </button>
                              )
                              : "—"}
                          </TableCell>
                          <TableCell className="py-3">
                            {row.isOptimized ? (
                              <span className="text-muted-foreground">…</span>
                            ) : row.suggestedCard ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="text-muted-foreground" aria-hidden>→</span>
                                <button
                                  type="button"
                                  title={row.suggestedCard.name}
                                  className={
                                    isRecommendedRow
                                      ? "inline-flex w-full max-w-[220px] min-w-0 items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                      : "inline-flex w-full max-w-[220px] min-w-0 items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  }
                                  onClick={() => openCardDetails(row.suggestedCard)}
                                >
                                  <span className="min-w-0 flex-1 truncate">
                                    {compactCardName(row.suggestedCard)}
                                  </span>
                                  <span className="shrink-0">
                                    ({row.suggestedMultiplier}x{isRecommendedRow ? " • Pick" : ""})
                                  </span>
                                </button>
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {row.isOptimized ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span
                                className={
                                  isRecommendedRow
                                    ? "font-medium text-success"
                                    : "font-medium text-muted-foreground"
                                }
                              >
                                +{formatSpend(row.incrementalAnnualDollars)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-primary/5 font-semibold hover:bg-primary/5">
                      <TableCell colSpan={4} className="font-semibold">
                        {strategy.recommendedCard
                          ? "Incremental Annual Value From Recommended Card"
                          : "Incremental Annual Value"}
                      </TableCell>
                      {strategy.recommendedCard ? (
                        <TableCell className="text-right font-semibold text-success">
                          +{formatSpend(strategy.incrementalAnnualDollars)}
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-semibold text-muted-foreground">
                          No net-positive change
                        </TableCell>
                      )}
                    </TableRow>
                  </TableFooter>
                  </Table>
                </div>
              </Card>
            </section>

            {/* 3. Recommended Addition Section */}
            {strategy.recommendedCard && strategy.incrementalAnnualDollars > 0 && (
              <section>
                <Card
                  role="button"
                  tabIndex={0}
                  onClick={() => openCardDetails(strategy.recommendedCard)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openCardDetails(strategy.recommendedCard)
                    }
                  }}
                  className="overflow-hidden border-2 border-primary/20 shadow-xl transition-shadow hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start gap-4">
                      <RecommendedCardImage card={strategy.recommendedCard} />
                      <div className="flex flex-wrap items-center gap-3 min-w-0">
                        <CardTitle className="text-xl font-bold text-foreground md:text-2xl">
                          {strategy.recommendedCard.name}
                        </CardTitle>
                        <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                          Recommended
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CardDescription className="text-base text-muted-foreground leading-relaxed">
                      {strategy.summaryReason}
                    </CardDescription>
                    <div className="flex flex-wrap gap-6 border-y border-border py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Annual value gain
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                          +{formatSpend(strategy.incrementalAnnualDollars)}/yr
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Annual fee
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                          ${strategy.recommendedCard.annualFee} annual fee
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Net annual impact
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                          {netAnnualImpact >= 0 ? "+" : "-"}
                          {formatSpend(Math.abs(netAnnualImpact))}/yr
                        </span>
                      </div>
                      {strategy.recommendedCard.signUpBonus != null && (
                        <div className="flex flex-col">
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Sign-up bonus
                          </span>
                          <span className="text-lg font-semibold text-foreground">
                            {formatPoints(strategy.recommendedCard.signUpBonus)} sign-up bonus
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      asChild
                      size="lg"
                      className="h-12 w-full gap-2 text-base font-semibold md:w-auto md:min-w-[200px]"
                    >
                      <Link
                        href={strategy.recommendedCard.applyUrl ?? "#"}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Apply Now
                        <ArrowRight className="size-5" aria-hidden />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

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
