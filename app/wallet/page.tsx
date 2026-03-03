"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ArrowRight, ArrowLeft, Plus, Wallet, CreditCard } from "lucide-react"
import type { Card } from "@/lib/types"
import { StepIndicator } from "@/components/step-indicator"
import { CardDetailDialog } from "@/components/card-detail-dialog"
import { Card as CardUi, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WalletCardItem } from "@/components/wallet-card-item"
import { usePointPath } from "@/contexts/pointpath-context"
import { getCardsByIds, searchCards } from "@/lib/cards"

export default function WalletPage() {
  const { walletCardIds, addWalletCard, removeWalletCard } = usePointPath()
  const [searchQuery, setSearchQuery] = useState("")
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const walletCards = useMemo(() => getCardsByIds(walletCardIds), [walletCardIds])

  const searchResults = useMemo(() => {
    const results = searchCards(searchQuery)
    return results.filter((c) => !walletCardIds.includes(c.id))
  }, [searchQuery, walletCardIds])

  return (
    <main className="min-h-svh bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-4">
          <StepIndicator currentStep={2} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 md:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent/10">
            <Wallet className="size-7 text-accent" />
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            What&apos;s in your wallet?
          </h1>
          <p className="mt-2 text-pretty text-base text-muted-foreground">
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
            className="h-12 w-full rounded-2xl pl-12"
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
        <section className="mb-10">
          {walletCards.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Cards
              </h2>
              <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {walletCards.length}
              </span>
            </div>
          )}

          {walletCards.length === 0 ? (
            <CardUi className="border-2 border-dashed bg-secondary/30">
              <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-secondary">
                  <CreditCard className="size-6 text-muted-foreground" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground">No cards added yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search above to add your first credit card
                </p>
              </CardContent>
            </CardUi>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {walletCards.map((card) => (
                <WalletCardItem
                  key={card.id}
                  card={card}
                  onRemove={() => removeWalletCard(card.id)}
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

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" className="gap-2 rounded-xl px-5">
            <Link href="/">
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
      </div>
    </main>
  )
}
