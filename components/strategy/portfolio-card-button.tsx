"use client"

import type { Card as CreditCard } from "@/lib/types"
import { formatSpend } from "@/lib/strategy-format"
import { RecommendedCardImage } from "./recommended-card-image"

export function PortfolioCardButton({
  card,
  onOpen,
}: {
  card: CreditCard
  onOpen: (card: CreditCard) => void
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-4 rounded-xl border border-border/70 bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => onOpen(card)}
    >
      <RecommendedCardImage card={card} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{card.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {card.synergyEcosystem ?? card.rewardCurrency ?? card.issuer ?? "Card"}
        </p>
        <p className="mt-2 text-sm font-medium text-foreground">
          {formatSpend(card.annualFee)} annual fee
        </p>
      </div>
    </button>
  )
}
