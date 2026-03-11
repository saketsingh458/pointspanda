"use client"

import { GitCompare, X } from "lucide-react"
import type { Card } from "@/lib/types"
import { COMPARE_MAX_CARDS, COMPARE_MIN_CARDS } from "@/lib/card-compare"
import { Button } from "@/components/ui/button"

type Props = {
  cards: Card[]
  onRemoveCard: (cardId: string) => void
  onClear: () => void
  onCompare: () => void
}

export function CardCompareTray({ cards, onRemoveCard, onClear, onCompare }: Props) {
  if (cards.length === 0) return null

  const cardsNeeded = Math.max(0, COMPARE_MIN_CARDS - cards.length)
  const compareDisabled = cards.length < COMPARE_MIN_CARDS

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 md:bottom-4 md:px-4 md:pb-0">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-border bg-card/98 p-3 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between md:gap-4 md:rounded-3xl md:p-4">
        {/* Info section */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-accent/10 md:size-10 md:rounded-2xl">
              <GitCompare className="size-4 text-accent md:size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground md:text-sm">
                Compare {cards.length}/{COMPARE_MAX_CARDS}
              </p>
              <p className="text-xs text-muted-foreground">
                {compareDisabled ? `Pick ${cardsNeeded} more` : "Ready to compare"}
              </p>
            </div>
          </div>

          {/* Card chips - horizontal scroll on mobile */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 md:mt-3 md:flex-wrap md:gap-2 md:overflow-visible md:pb-0">
            {cards.map((card) => (
              <span
                key={card.id}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground md:gap-2 md:px-3 md:py-1.5 md:text-sm"
              >
                <span className="max-w-[120px] truncate md:max-w-[180px]">{card.name}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => onRemoveCard(card.id)}
                  aria-label={`Remove ${card.name} from comparison`}
                >
                  <X className="size-3 md:size-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            className="h-9 rounded-lg px-3 text-xs md:h-10 md:rounded-xl md:px-4 md:text-sm" 
            onClick={onClear}
          >
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 flex-1 rounded-lg px-3 text-xs md:h-10 md:flex-none md:rounded-xl md:px-4 md:text-sm"
            disabled={compareDisabled}
            onClick={onCompare}
          >
            <GitCompare className="size-3.5 md:size-4" aria-hidden />
            Compare
          </Button>
        </div>
      </div>
    </div>
  )
}
