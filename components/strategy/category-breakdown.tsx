"use client"

import type {
  Card as CreditCard,
  SpendCategoryId,
  StrategyResult,
} from "@/lib/types"
import { CATEGORY_ICONS } from "@/lib/card-ui"
import {
  compactCardName,
  deltaClassName,
  formatSignedSpend,
  formatSpend,
  getStrategyCopy,
} from "@/lib/strategy-format"
import {
  Card,
  CardContent,
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
import { cn } from "@/lib/utils"

export function CategoryTableSection({
  strategy,
  monthlySpend,
  onOpenCardDetails,
}: {
  strategy: StrategyResult
  monthlySpend: Record<SpendCategoryId, number>
  onOpenCardDetails: (card: CreditCard) => void
}) {
  const copy = getStrategyCopy(strategy.viewId, strategy.feeMode)
  const recommendedCardIds = new Set(strategy.recommendedCards.map((card) => card.id))

  return (
    <section className="mb-14 hidden md:block">
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
                  Incremental Rewards
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
                  Total incremental rewards vs current
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

export function CategoryCardSection({
  strategy,
  monthlySpend,
  onOpenCardDetails,
}: {
  strategy: StrategyResult
  monthlySpend: Record<SpendCategoryId, number>
  onOpenCardDetails: (card: CreditCard) => void
}) {
  const copy = getStrategyCopy(strategy.viewId, strategy.feeMode)

  return (
    <section className="mb-14 md:hidden">
      <h2 className="mb-3 text-lg font-semibold text-foreground">Category-by-Category Strategy</h2>
      <p className="mb-4 text-sm text-muted-foreground">{copy.categoryIntro}</p>
      <div className="space-y-3">
        {strategy.categoryRows.map((row) => {
          const Icon = CATEGORY_ICONS[row.categoryId]
          const annualSpend = (monthlySpend[row.categoryId] ?? 0) * 12

          return (
            <Card key={row.categoryId} className="border-border/70">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
                    {row.categoryLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {annualSpend > 0 ? `${formatSpend(annualSpend)}/yr` : "—"}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Current best
                  </p>
                  {row.currentBestCard ? (
                    <button
                      type="button"
                      className="mt-1 text-left text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                      onClick={() => onOpenCardDetails(row.currentBestCard!)}
                    >
                      {compactCardName(row.currentBestCard)} ({row.currentMultiplier}x)
                    </button>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Suggested
                  </p>
                  {row.suggestedCard ? (
                    <button
                      type="button"
                      className="mt-1 text-left text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                      onClick={() => onOpenCardDetails(row.suggestedCard!)}
                    >
                      {compactCardName(row.suggestedCard)} ({row.suggestedMultiplier}x)
                    </button>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">—</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Incremental rewards</span>
                  <span className={cn("font-semibold", deltaClassName(row.incrementalAnnualDollars))}>
                    {row.incrementalAnnualDollars === 0
                      ? "No change"
                      : formatSignedSpend(row.incrementalAnnualDollars)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
