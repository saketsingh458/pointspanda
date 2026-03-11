"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Search, ArrowRight, ArrowLeft, Plus, Wallet, CreditCard, GitCompare, Loader2 } from "lucide-react"
import type { Card } from "@/lib/types"
import { COMPARE_MAX_CARDS, COMPARE_MIN_CARDS } from "@/lib/card-compare"
import { CardCompareDialog } from "@/components/card-compare-dialog"
import { CardCompareTray } from "@/components/card-compare-tray"
import { AppHeader } from "@/components/app-header"
import { CardDetailDialog } from "@/components/card-detail-dialog"
import { Card as CardUi, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WalletCardItem } from "@/components/wallet-card-item"
import { usePointPath } from "@/contexts/pointpath-context"
import { getCardsByIds, searchCards } from "@/lib/cards"
import { cn } from "@/lib/utils"

export default function WalletPage() {
  const {
    walletCardIds,
    compareCardIds,
    addWalletCard,
    removeWalletCard,
    toggleCompareCard,
    removeCompareCard,
    clearCompareCards,
  } = usePointPath()
  const [searchQuery, setSearchQuery] = useState("")
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)

  // Simulate initial load for hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  const walletCards = useMemo(() => getCardsByIds(walletCardIds), [walletCardIds])
  const compareCards = useMemo(() => getCardsByIds(compareCardIds), [compareCardIds])

  const searchResults = useMemo(() => {
    const results = searchCards(searchQuery)
    return results.filter((c) => !walletCardIds.includes(c.id))
  }, [searchQuery, walletCardIds])

  const compareLimitReached = compareCardIds.length >= COMPARE_MAX_CARDS
  const compareReady = compareCards.length >= COMPARE_MIN_CARDS

  function openCardDetails(card: Card) {
    setCompareOpen(false)
    setDetailCard(card)
    setDetailOpen(true)
  }

  function handleAddCard(card: Card) {
    addWalletCard(card.id)
    setSearchQuery("")
    setSearchFocused(false)
  }

  // Calculate bottom padding needed for fixed elements
  const bottomPadding = compareCards.length > 0 ? "pb-44 md:pb-36" : "pb-24 md:pb-8"

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader currentStep={2} showBack />

      <main className={cn("mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-10", bottomPadding)}>
        {/* Header */}
        <div className="mb-6 text-center md:mb-8">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-accent/10 md:mb-4 md:size-14">
            <Wallet className="size-6 text-accent md:size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance md:text-3xl lg:text-4xl">
            What&apos;s in your wallet?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty md:text-base">
            Add your current credit cards so we can calculate your baseline rewards.
          </p>
        </div>

        {/* Search: add a card from catalog */}
        <div className="relative mb-6 md:mb-8">
          <Search
            className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground md:left-4"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search for a card..."
            className="h-11 w-full rounded-xl pl-10 text-base md:h-12 md:rounded-2xl md:pl-12"
            aria-label="Search for a credit card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          
          {/* Search dropdown */}
          {searchQuery.trim() && searchResults.length > 0 && searchFocused && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 max-h-[60vh] overflow-auto rounded-xl border border-border bg-card shadow-xl md:max-h-80">
              {searchResults.slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-3 last:border-0 hover:bg-muted/50 md:gap-3 md:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground md:text-base">{card.name}</p>
                    <p className="truncate text-xs text-muted-foreground md:text-sm">
                      {card.issuer ?? card.synergyEcosystem ?? "Card"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                    <Button
                      type="button"
                      variant={compareCardIds.includes(card.id) ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 rounded-lg px-2 text-xs md:h-9 md:rounded-xl md:px-3"
                      disabled={compareLimitReached && !compareCardIds.includes(card.id)}
                      onClick={() => toggleCompareCard(card.id)}
                    >
                      <GitCompare className="size-3.5 md:size-4" aria-hidden />
                      <span className="hidden sm:inline">{compareCardIds.includes(card.id) ? "Selected" : "Compare"}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 rounded-lg px-2 text-xs md:h-9 md:rounded-xl md:px-3"
                      onClick={() => handleAddCard(card)}
                    >
                      <Plus className="size-3.5 md:size-4" aria-hidden />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {searchQuery.trim() && searchResults.length === 0 && searchFocused && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-xl border border-border bg-card p-4 text-center shadow-xl">
              <p className="text-sm text-muted-foreground">No cards found matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>

        {/* Active Wallet */}
        <section className="mb-6 md:mb-8">
          {walletCards.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Cards
              </h2>
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {walletCards.length}
              </span>
            </div>
          )}

          {isLoading ? (
            <CardUi className="border-2 border-dashed bg-secondary/30">
              <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center md:py-16">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Loading your wallet...</p>
              </CardContent>
            </CardUi>
          ) : walletCards.length === 0 ? (
            <CardUi className="border-2 border-dashed bg-secondary/30">
              <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center md:px-6 md:py-16">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary">
                  <CreditCard className="size-6 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground md:text-base">No cards added yet</p>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                  Search above to add your first credit card
                </p>
              </CardContent>
            </CardUi>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              {walletCards.map((card) => (
                <WalletCardItem
                  key={card.id}
                  card={card}
                  onRemove={() => removeWalletCard(card.id)}
                  onCompareToggle={() => toggleCompareCard(card.id)}
                  isCompared={compareCardIds.includes(card.id)}
                  compareDisabled={compareLimitReached && !compareCardIds.includes(card.id)}
                  onCardClick={() => {
                    setDetailCard(card)
                    setDetailOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <CardDetailDialog
          card={detailCard}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open)
            if (!open) setDetailCard(null)
          }}
        />

        <CardCompareDialog
          cards={compareCards}
          open={compareOpen && compareReady}
          onOpenChange={setCompareOpen}
          onRemoveCard={removeCompareCard}
          onOpenCardDetails={openCardDetails}
        />

        {/* Navigation Buttons - Desktop */}
        <div className="hidden items-center justify-between md:flex">
          <Button asChild variant="outline" className="gap-2 rounded-xl px-5">
            <Link href="/intake">
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            disabled={walletCards.length === 0}
          >
            <Link href="/strategy">
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </main>

      {/* Fixed bottom navigation - Mobile */}
      <div className={cn(
        "fixed inset-x-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden",
        compareCards.length > 0 ? "bottom-[136px]" : "bottom-0"
      )}>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="flex-1 gap-2 rounded-xl">
            <Link href="/intake">
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Link>
          </Button>
          <Button
            asChild
            className="flex-1 gap-2 rounded-xl"
            disabled={walletCards.length === 0}
          >
            <Link href="/strategy">
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <CardCompareTray
        cards={compareCards}
        onRemoveCard={removeCompareCard}
        onClear={clearCompareCards}
        onCompare={() => {
          if (compareReady) {
            setCompareOpen(true)
          }
        }}
      />
    </div>
  )
}
