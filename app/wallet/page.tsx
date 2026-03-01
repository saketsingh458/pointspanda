"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ArrowRight, Plus } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PointsPandaLogo } from "@/components/points-panda-logo"
import { AppFooter } from "@/components/app-footer"
import { StepIndicator } from "@/components/step-indicator"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WalletCardItem } from "@/components/wallet-card-item"
import { usePointPath } from "@/contexts/pointpath-context"
import { getCardsByIds, searchCards } from "@/lib/cards"

export default function WalletPage() {
  const { walletCardIds, addWalletCard, removeWalletCard } = usePointPath()
  const [searchQuery, setSearchQuery] = useState("")

  const walletCards = useMemo(() => getCardsByIds(walletCardIds), [walletCardIds])

  const searchResults = useMemo(() => {
    const results = searchCards(searchQuery)
    return results.filter((c) => !walletCardIds.includes(c.id))
  }, [searchQuery, walletCardIds])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4 md:px-10">
        <PointsPandaLogo />
        <StepIndicator currentStep={2} />
        <div className="flex w-20 justify-end">
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col px-6 py-12 md:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            What&apos;s in your wallet?
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Add your current credit cards so we can calculate your baseline
            rewards.
          </p>
        </div>

        {/* Search: add a card from catalog */}
        <div className="relative mb-10">
          <Search
            className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search for a card (e.g., Chase Sapphire Reserve)..."
            className="h-12 w-full rounded-lg pl-12"
            aria-label="Search for a credit card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card shadow-lg">
              {searchResults.slice(0, 8).map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50"
                  onClick={() => {
                    addWalletCard(card.id)
                    setSearchQuery("")
                  }}
                >
                  <span className="font-medium text-foreground">{card.name}</span>
                  <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Wallet */}
        <section className="mb-12">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Your cards
          </h2>
          {walletCards.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No cards added yet. Search above to add cards from the catalog.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {walletCards.map((card) => (
                <WalletCardItem
                  key={card.id}
                  card={card}
                  onRemove={() => removeWalletCard(card.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Action Area */}
        <div className="mt-auto flex justify-end border-t border-border pt-8">
          <Button size="lg" asChild className="h-12 gap-2 px-8 text-base font-semibold">
            <Link href="/strategy">
              See My Strategy
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
