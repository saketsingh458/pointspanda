"use client"

import type {
  AggregatedStatementCredit,
  AttributedBenefit,
  Card as CreditCard,
  SpendCategoryId,
  StrategyResult,
} from "@/lib/types"
import { CATEGORY_ICONS } from "@/lib/card-ui"
import {
  classifyToSpendCategory,
  compactCardName,
  deltaClassName,
  formatFrequency,
  formatSpend,
  spendCategoryLabel,
} from "@/lib/strategy-format"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const CATEGORY_ORDER: SpendCategoryId[] = [
  "travel",
  "dining",
  "groceries",
  "gasEv",
  "streamingEntertainment",
  "drugstores",
  "rentMortgage",
  "other",
]

function buildCategoryBuckets(
  credits: AggregatedStatementCredit[],
  benefits: AttributedBenefit[]
): Array<{
  categoryId: SpendCategoryId
  totalCredits: number
  creditItems: AggregatedStatementCredit[]
  benefitItems: AttributedBenefit[]
}> {
  return CATEGORY_ORDER.map((categoryId) => {
    const creditItems = credits.filter(
      (credit) => classifyToSpendCategory(credit.name) === categoryId
    )
    const benefitItems = benefits.filter(
      (benefit) => classifyToSpendCategory(benefit.label) === categoryId
    )
    return {
      categoryId,
      totalCredits: creditItems.reduce((sum, credit) => sum + credit.annualAmount, 0),
      creditItems,
      benefitItems,
    }
  }).filter((bucket) => bucket.creditItems.length > 0 || bucket.benefitItems.length > 0)
}

type Bucket = ReturnType<typeof buildCategoryBuckets>[number]

function CategoryBucketList({
  buckets,
  emphasized = false,
}: {
  buckets: Bucket[]
  emphasized?: boolean
}) {
  if (buckets.length === 0) {
    return <p className="text-sm text-muted-foreground">No statement credits or benefits.</p>
  }

  return (
    <div className="space-y-3">
      {buckets.map((bucket) => {
        const Icon = CATEGORY_ICONS[bucket.categoryId]
        const totalItems = bucket.creditItems.length + bucket.benefitItems.length
        return (
          <details
            key={bucket.categoryId}
            className="group rounded-xl border border-border/60 bg-background px-3 py-2.5 transition-colors open:border-primary/30"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                    {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
                    {spendCategoryLabel(bucket.categoryId)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalItems} item{totalItems === 1 ? "" : "s"} in this category
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                    {bucket.creditItems.length} credits
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                    {bucket.benefitItems.length} benefits
                  </Badge>
                  <p
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      emphasized ? "text-primary" : "text-foreground"
                    )}
                  >
                    {formatSpend(bucket.totalCredits)}/yr
                  </p>
                </div>
              </div>
            </summary>
            <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
              {bucket.creditItems.length > 0 && (
                <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Statement Credits
                  </p>
                  <ul className="space-y-2">
                    {bucket.creditItems.map((credit) => (
                      <li key={credit.name} className="rounded-md border border-border/50 bg-background p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{credit.name}</p>
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            {formatSpend(credit.annualAmount)}/yr
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Frequency: {formatFrequency(credit.frequency)}
                        </p>
                        <ul className="mt-2 space-y-1 rounded-md bg-muted/20 p-2">
                          {credit.contributions.map((entry) => (
                            <li
                              key={`${credit.name}-${entry.cardId}`}
                              className="flex items-center justify-between text-xs text-muted-foreground"
                            >
                              <span>{compactCardName({ name: entry.cardName } as CreditCard)}</span>
                              <span className="tabular-nums">{formatSpend(entry.annualAmount)}/yr</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {bucket.benefitItems.length > 0 && (
                <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Benefits
                  </p>
                  <ul className="space-y-2">
                    {bucket.benefitItems.map((benefit) => (
                      <li key={benefit.label} className="rounded-md border border-border/50 bg-background p-2.5">
                        <p className="text-sm font-medium text-foreground">{benefit.label}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {benefit.cardNames.map((cardName) => (
                            <Badge
                              key={`${benefit.label}-${cardName}`}
                              variant="outline"
                              className="rounded-full px-2 py-0.5 text-[11px]"
                            >
                              {compactCardName({ name: cardName } as CreditCard)}
                            </Badge>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}

export function BenefitsCreditsSection({ strategy }: { strategy: StrategyResult }) {
  const currentCredits = strategy.currentStatementCredits ?? []
  const scenarioCredits = strategy.scenarioStatementCredits ?? []
  const currentBenefits = strategy.currentBenefitItems ?? []
  const scenarioBenefits = strategy.scenarioBenefitItems ?? []
  const hasCurrent = currentCredits.length > 0 || currentBenefits.length > 0
  const hasScenario = scenarioCredits.length > 0 || scenarioBenefits.length > 0

  if (!hasCurrent && !hasScenario) return null

  const currentCreditsTotal = currentCredits.reduce((sum, credit) => sum + credit.annualAmount, 0)
  const scenarioCreditsTotal = scenarioCredits.reduce((sum, credit) => sum + credit.annualAmount, 0)
  const creditsDelta = scenarioCreditsTotal - currentCreditsTotal

  const currentBuckets = buildCategoryBuckets(currentCredits, currentBenefits)
  const scenarioBuckets = buildCategoryBuckets(scenarioCredits, scenarioBenefits)

  return (
    <section className="mb-14">
      <h2 className="mb-2 text-lg font-semibold text-foreground">Statement Credits & Benefits</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Compare full current vs suggested sets by category. Expand any category to see which card gives each credit or benefit, and the credit amount.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader className="space-y-2 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Current Wallet</CardTitle>
            <p className="text-sm font-medium text-foreground">
              Total statement credits: {formatSpend(currentCreditsTotal)}/yr
            </p>
          </CardHeader>
          <CardContent>
            <CategoryBucketList buckets={currentBuckets} />
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-primary">Suggested Strategy</CardTitle>
              {creditsDelta !== 0 && (
                <Badge
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    creditsDelta > 0
                      ? "bg-success text-success-foreground hover:bg-success"
                      : "bg-destructive text-white hover:bg-destructive"
                  )}
                >
                  {creditsDelta > 0 ? "+" : "-"}
                  {formatSpend(Math.abs(creditsDelta))}/yr vs current
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-foreground">
              Total statement credits: {formatSpend(scenarioCreditsTotal)}/yr
            </p>
          </CardHeader>
          <CardContent>
            <CategoryBucketList buckets={scenarioBuckets} emphasized />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
