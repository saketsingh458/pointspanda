"use client"

import { useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsPandaLogo } from "@/components/points-panda-logo"
import { AppFooter } from "@/components/app-footer"
import { StepIndicator } from "@/components/step-indicator"
import { SpendCategorySliders } from "@/components/spend-category-sliders"
import { BrandLoyaltySelector } from "@/components/brand-loyalty-selector"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePointPath } from "@/contexts/pointpath-context"

export default function IntakePage() {
  const {
    monthlySpend: categoryValues,
    brandSpends,
    updateCategorySpend,
    updateBrandSpend,
  } = usePointPath()

  const handleCategoryChange = useCallback(
    (id: string, value: number) => {
      updateCategorySpend(id, value)
    },
    [updateCategorySpend]
  )

  const handleBrandChange = useCallback(
    (brandId: string, value: number | null) => {
      updateBrandSpend(brandId, value)
    },
    [updateBrandSpend]
  )

  const allocatedTotal = Object.values(categoryValues).reduce((sum, v) => sum + (typeof v === "number" ? v : 0), 0)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-10">
        <PointsPandaLogo />
        <StepIndicator currentStep={1} />
        <div className="flex w-20 justify-end">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex flex-1 flex-col max-w-5xl px-6 py-10 md:px-10 md:py-16">
        {/* Header */}
        <div className="mb-10 text-center md:mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
            Tell Us About Your Spending
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-lg mx-auto text-pretty">
            Estimate your monthly expenses to maximize your points, miles, and cashback.
          </p>
        </div>

        {/* Category Breakdown */}
        <Card className="mx-auto w-full max-w-3xl border-border shadow-md transition-shadow hover:shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Estimated Monthly Spend</CardTitle>
            <CardDescription>
              Drag the sliders to estimate your spending across categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <SpendCategorySliders
              totalSpend={allocatedTotal}
              values={categoryValues}
              onChange={handleCategoryChange}
            />

            {/* Total bar */}
            {allocatedTotal > 0 && (
              <div className="mt-8 flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(allocatedTotal)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Loyalty */}
        <Card className="mx-auto mt-8 w-full max-w-3xl border-border shadow-md transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Specific Brand Spend (Optional)</CardTitle>
            <CardDescription>
              Do you spend heavily with specific brands? Select them below to see co-branded card strategies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BrandLoyaltySelector
              selectedBrands={brandSpends}
              onChange={handleBrandChange}
            />
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-10 flex justify-end md:mt-14">
          <Button size="lg" asChild className="h-12 gap-2 px-8 text-base font-semibold">
            <Link href="/wallet">
              Next: Add Your Cards
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
