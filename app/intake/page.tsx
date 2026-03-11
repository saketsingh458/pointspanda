"use client"

import { useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { SpendCategorySliders } from "@/components/spend-category-sliders"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePointPath } from "@/contexts/pointpath-context"

export default function IntakePage() {
  const {
    monthlySpend: categoryValues,
    updateCategorySpend,
  } = usePointPath()

  const handleCategoryChange = useCallback(
    (id: string, value: number) => {
      updateCategorySpend(id, value)
    },
    [updateCategorySpend]
  )

  const allocatedTotal = Object.values(categoryValues).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader currentStep={1} showBack />

      <main className="mx-auto flex flex-1 flex-col w-full max-w-5xl px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center md:mb-10">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="size-6 text-primary" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance md:text-3xl lg:text-4xl">
            Tell Us About Your Spending
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto text-pretty md:text-base">
            Estimate your monthly expenses to maximize your points, miles, and cashback.
          </p>
        </div>

        {/* Category Breakdown */}
        <Card className="mx-auto w-full max-w-3xl border-border shadow-sm">
          <CardHeader className="px-4 pb-3 md:px-6 md:pb-4">
            <CardTitle className="text-base md:text-lg">Estimated Monthly Spend</CardTitle>
            <CardDescription className="text-sm">
              Drag the sliders to estimate your spending across categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 md:px-6 md:pb-6">
            <SpendCategorySliders
              totalSpend={allocatedTotal}
              values={categoryValues}
              onChange={handleCategoryChange}
            />

            {/* Total bar - sticky on mobile for visibility */}
            <div className="sticky bottom-0 left-0 right-0 -mx-4 mt-6 border-t border-border bg-card px-4 py-4 md:static md:mx-0 md:mt-8 md:rounded-xl md:border md:bg-secondary/50 md:px-4 md:py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Monthly Total</span>
                <span className="text-lg font-bold tabular-nums text-foreground md:text-xl">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(allocatedTotal)}
                </span>
              </div>
              {allocatedTotal > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(allocatedTotal * 12)}/year
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA - Fixed bottom bar on mobile */}
        <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card/95 p-4 backdrop-blur md:static md:mt-10 md:flex md:justify-end md:border-0 md:bg-transparent md:p-0">
          <Button 
            size="lg" 
            asChild 
            className="h-12 w-full gap-2 text-base font-semibold md:w-auto md:min-w-[200px]"
          >
            <Link href="/wallet">
              Next: Add Your Cards
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
        
        {/* Spacer for fixed CTA on mobile */}
        <div className="h-20 md:hidden" aria-hidden />
      </main>

      <AppFooter />
    </div>
  )
}
