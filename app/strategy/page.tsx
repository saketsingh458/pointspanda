"use client"

import Link from "next/link"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { AppFooter } from "@/components/app-footer"
import { CardDetailDialog } from "@/components/card-detail-dialog"
import { FlowHeader } from "@/components/flow-header"
import {
  BenefitsCreditsSection,
  CategoryCardSection,
  CategoryTableSection,
  EcosystemRecommendationSection,
  FootnotesSection,
  SingleCardRecommendationSection,
  StrategySummarySection,
} from "@/components/strategy"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePointPath } from "@/contexts/pointpath-context"
import { computeStrategyViews } from "@/lib/strategy"
import { STRATEGY_TABS } from "@/lib/strategy-format"
import type {
  AnnualFeeMode,
  Card as CreditCard,
  StrategyViewId,
} from "@/lib/types"

export default function StrategyPage() {
  const { monthlySpend, walletCardIds, hydrated } = usePointPath()
  const [feeMode, setFeeMode] = useState<AnnualFeeMode>("full")
  const [isRecomputing, startTransition] = useTransition()
  const [showEvaluationInterstitial, setShowEvaluationInterstitial] = useState(true)
  const strategyViews = useMemo(
    () => computeStrategyViews(monthlySpend, walletCardIds, feeMode),
    [monthlySpend, walletCardIds, feeMode]
  )
  const [activeView, setActiveView] = useState<StrategyViewId>("nextBestCard")
  const [detailCard, setDetailCard] = useState<CreditCard | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const strategy = strategyViews[activeView]

  const totalMonthlySpend = Object.values(monthlySpend).reduce((a, b) => a + b, 0)
  const showEmptyState = totalMonthlySpend === 0
  const showStrategyContent = hydrated && !showEmptyState && !showEvaluationInterstitial

  useEffect(() => {
    if (!hydrated || showEmptyState || !showEvaluationInterstitial) return
    const timerId = window.setTimeout(() => {
      setShowEvaluationInterstitial(false)
    }, 1800)
    return () => window.clearTimeout(timerId)
  }, [hydrated, showEmptyState, showEvaluationInterstitial])

  function openCardDetails(card: CreditCard | null | undefined) {
    if (!card) return
    setDetailCard(card)
    setDetailOpen(true)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <FlowHeader currentStep={3} stepTitle="Strategy" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Your Strategy
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Compare your next best card, your best one-card setup, and the best ecosystem portfolio for your spending profile.
          </p>
        </div>

        {showStrategyContent ? (
          <section className="mb-10 space-y-4">
            <div className="grid gap-2 rounded-2xl border border-border bg-muted/40 p-2 sm:inline-flex sm:flex-wrap">
              {STRATEGY_TABS.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant={activeView === tab.id ? "default" : "ghost"}
                  className="min-h-10 justify-start rounded-xl sm:justify-center"
                  onClick={() => {
                    startTransition(() => {
                      setActiveView(tab.id)
                    })
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        {!hydrated ? (
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <p className="text-sm font-medium text-foreground">Restoring your strategy data...</p>
              <p className="mt-1 text-sm text-muted-foreground">Loading your wallet and spend profile.</p>
            </CardContent>
          </Card>
        ) : showEmptyState ? (
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
        ) : showEvaluationInterstitial ? (
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <p className="text-xl font-semibold text-foreground md:text-2xl">
                Evaluating your spend and wallet...
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Building your ideal credit card spend strategy.
              </p>
              <div className="mx-auto mt-8 w-full max-w-md">
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div className="evaluation-loader-bar absolute inset-y-0 w-1/3 rounded-full bg-primary/85" />
                  <div className="evaluation-loader-bar-delayed absolute inset-y-0 w-1/4 rounded-full bg-primary/60" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <StrategySummarySection
              strategy={strategy}
              feeMode={feeMode}
              onFeeModeChange={(mode) => startTransition(() => setFeeMode(mode))}
              isRecomputing={isRecomputing}
            />
            <CategoryCardSection
              strategy={strategy}
              monthlySpend={monthlySpend}
              onOpenCardDetails={openCardDetails}
            />
            <CategoryTableSection
              strategy={strategy}
              monthlySpend={monthlySpend}
              onOpenCardDetails={openCardDetails}
            />
            <BenefitsCreditsSection strategy={strategy} />
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

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/wallet">
              <ArrowLeft className="size-4" aria-hidden />
              Back to Wallet
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/">Exit to Home</Link>
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
      <style jsx>{`
        @keyframes strategy-load-slide {
          0% {
            transform: translateX(-140%);
          }
          100% {
            transform: translateX(460%);
          }
        }
        .evaluation-loader-bar {
          animation: strategy-load-slide 1.15s ease-in-out infinite;
        }
        .evaluation-loader-bar-delayed {
          animation: strategy-load-slide 1.15s ease-in-out 0.5s infinite;
        }
      `}</style>
    </div>
  )
}
