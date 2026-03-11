"use client"

import type { AnnualFeeMode, StrategyResult } from "@/lib/types"
import {
  FEE_MODE_OPTIONS,
  deltaClassName,
  formatSignedSpend,
  formatSpend,
  getStrategyCopy,
} from "@/lib/strategy-format"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StrategySummarySection({
  strategy,
  feeMode,
  onFeeModeChange,
  isRecomputing,
}: {
  strategy: StrategyResult
  feeMode: AnnualFeeMode
  onFeeModeChange: (mode: AnnualFeeMode) => void
  isRecomputing: boolean
}) {
  const copy = getStrategyCopy(strategy.viewId, strategy.feeMode)
  const scenarioCreditsTotal = (strategy.scenarioStatementCredits ?? []).reduce(
    (sum, credit) => sum + credit.annualAmount,
    0
  )
  const currentCreditsTotal = (strategy.currentStatementCredits ?? []).reduce(
    (sum, credit) => sum + credit.annualAmount,
    0
  )
  const creditsDelta = scenarioCreditsTotal - currentCreditsTotal
  const scenarioAnnualFee = strategy.scenarioAnnualFeeActual
  const annualFeeDelta = strategy.scenarioAnnualFeeActual - strategy.currentAnnualFeeActual
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Statement credits
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatSpend(scenarioCreditsTotal)}/yr
                </p>
                {creditsDelta !== 0 && (
                  <p className={cn("mt-1 text-xs font-medium", deltaClassName(creditsDelta))}>
                    {formatSignedSpend(creditsDelta)}/yr vs current
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-border/60 bg-background p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Annual fee
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatSpend(scenarioAnnualFee)}/yr
                </p>
                {annualFeeDelta !== 0 && (
                  <p className={cn("mt-1 text-xs font-medium", deltaClassName(annualFeeDelta))}>
                    {formatSignedSpend(annualFeeDelta)} vs current
                  </p>
                )}
                {strategy.feeMode === "none" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shown as real fee; ignored in Rewards Only ranking
                  </p>
                )}
              </div>
            </div>
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
            <div className="rounded-xl border border-border/70 bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Why this recommendation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{strategy.summaryReason}</p>
              <p className="mt-2 text-xs text-muted-foreground">{copy.rankingNote}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  How we treat annual fees
                </span>
                <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
                  {FEE_MODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      title={opt.tooltip}
                      className={cn(
                        "min-h-9 rounded-md px-3 py-1.5 text-left text-xs font-medium transition-colors sm:text-center",
                        feeMode === opt.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => onFeeModeChange(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {isRecomputing && (
                  <span className="text-xs text-muted-foreground">Recalculating...</span>
                )}
              </div>
              <a
                href="#strategy-assumptions"
                className="mt-4 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Review assumptions and limitations
              </a>
            </div>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Statement credits
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatSpend(currentCreditsTotal)}/yr
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Annual fee
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatSpend(strategy.currentAnnualFeeActual)}/yr
                </p>
                {strategy.feeMode === "none" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shown as real fee; ignored in Rewards Only ranking
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Based on your current wallet cards and estimated spend profile.
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
