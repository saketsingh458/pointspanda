"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type {
  Card as CreditCard,
  EcosystemStrategyOption,
  StrategyResult,
} from "@/lib/types"
import {
  deltaClassName,
  formatPoints,
  formatSignedSpend,
  formatSpend,
  getStrategyCopy,
} from "@/lib/strategy-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RecommendedCardImage } from "./recommended-card-image"
import { PortfolioCardButton } from "./portfolio-card-button"

export function SingleCardRecommendationSection({
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
                {getStrategyCopy(strategy.viewId, strategy.feeMode).detailBadge}
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
          <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-2 xl:grid-cols-4">
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
              Apply on issuer site
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

export function EcosystemRecommendationSection({
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
              {getStrategyCopy("bestEcosystem", strategy.feeMode).detailBadge}
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
