"use client"

import Link from "next/link"
import { ArrowRight, Home, UtensilsCrossed, Plane, ShoppingCart, Fuel, CircleDollarSign } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { SpendCategoryId } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsPandaLogo } from "@/components/points-panda-logo"
import { AppFooter } from "@/components/app-footer"
import { StepIndicator } from "@/components/step-indicator"
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
import { usePointPath } from "@/contexts/pointpath-context"
import { computeStrategy } from "@/lib/strategy"

const CATEGORY_ICONS: Record<SpendCategoryId, LucideIcon> = {
  travel: Plane,
  dining: UtensilsCrossed,
  groceries: ShoppingCart,
  gas: Fuel,
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

export default function StrategyPage() {
  const { monthlySpend, walletCardIds } = usePointPath()
  const strategy = computeStrategy(monthlySpend, walletCardIds)

  const hasData = walletCardIds.length > 0
  const totalMonthlySpend = Object.values(monthlySpend).reduce((a, b) => a + b, 0)
  const showEmptyState = !hasData || totalMonthlySpend === 0

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4 md:px-10">
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
            Here is how you can maximize your points based on your spending.
          </p>
        </div>

        {showEmptyState ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">
                Add your spending on the intake page and at least one card in your wallet to see your strategy.
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
            {/* 1. Top Summary Cards (Maximum vs. Current) */}
            <section className="mb-14">
              <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-4">
                <Card className="flex-1 border-2 border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-transparent shadow-lg dark:from-amber-950/20 dark:border-amber-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Maximum Potential Annual Earn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <p className="text-4xl font-bold tracking-tight text-amber-600 dark:text-amber-400 md:text-5xl">
                        {formatPoints(strategy.maxPotentialAnnualPoints)}
                      </p>
                      {strategy.incrementalAnnualPoints > 0 && (
                        <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">
                          +{formatPoints(strategy.incrementalAnnualPoints)} pts/yr
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {strategy.summaryReason}
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
                              className="rounded-full border-amber-500/40 px-3 py-1 text-amber-700 dark:text-amber-400"
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
                      Current Estimated Annual Earn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                      {formatPoints(strategy.currentAnnualPoints)}
                    </p>
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
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Spend</TableHead>
                      <TableHead className="font-semibold">Current Best Card</TableHead>
                      <TableHead className="font-semibold">New Strategy</TableHead>
                      <TableHead className="text-right font-semibold">
                        Incremental Annual Pts
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategy.categoryRows.map((row) => {
                      const Icon = CATEGORY_ICONS[row.categoryId]
                      const annualSpend = (monthlySpend[row.categoryId] ?? 0) * 12
                      return (
                        <TableRow key={row.categoryId}>
                          <TableCell className="font-medium">
                            <span className="inline-flex items-center gap-2">
                              {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
                              {row.categoryLabel}
                            </span>
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {annualSpend > 0 ? formatSpend(annualSpend) + "/yr" : "—"}
                          </TableCell>
                          <TableCell>
                            {row.currentBestCard
                              ? `${row.currentBestCard.name} (${row.currentMultiplier}x)`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {row.isOptimized ? (
                              <span className="text-muted-foreground">…</span>
                            ) : row.suggestedCard ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="text-muted-foreground" aria-hidden>→</span>
                                <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                  {row.suggestedCard.name} ({row.suggestedMultiplier}x)
                                </span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.isOptimized ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                +{formatPoints(row.incrementalAnnualPoints)}
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
                        Total Incremental Points
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatPoints(strategy.incrementalAnnualPoints)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </Card>
            </section>

            {/* 3. Recommended Addition Section */}
            {strategy.recommendedCard && strategy.incrementalAnnualPoints > 0 && (
              <section>
                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle className="text-xl font-bold text-foreground md:text-2xl">
                        {strategy.recommendedCard.name}
                      </CardTitle>
                      <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
                        Recommended
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CardDescription className="text-base text-muted-foreground leading-relaxed">
                      {strategy.summaryReason}
                    </CardDescription>
                    <div className="flex flex-wrap gap-6 border-y border-border py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Points gain
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                          +{formatPoints(strategy.incrementalAnnualPoints)} pts/yr
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
                      <Link href={strategy.recommendedCard.applyUrl ?? "#"}>
                        Apply Now
                        <ArrowRight className="size-5" aria-hidden />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
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

      <AppFooter />
    </div>
  )
}
