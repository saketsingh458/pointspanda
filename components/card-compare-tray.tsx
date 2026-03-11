"use client"

import { useState } from "react"
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
  const [showSelections, setShowSelections] = useState(false)
  if (cards.length === 0) return null

  const cardsNeeded = Math.max(0, COMPARE_MIN_CARDS - cards.length)
  const compareDisabled = cards.length < COMPARE_MIN_CARDS

  return (
    <div className="fixed inset-x-0 bottom-2 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:bottom-4 sm:px-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-3xl sm:p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-accent/10">
              <GitCompare className="size-5 text-accent" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Compare {cards.length} of {COMPARE_MAX_CARDS} cards
              </p>
              <p className="text-sm text-muted-foreground">
                {compareDisabled ? `Pick ${cardsNeeded} more card${cardsNeeded === 1 ? "" : "s"} to compare.` : "Ready for a head-to-head view."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="mt-2 text-left text-xs font-medium text-primary underline-offset-4 hover:underline sm:hidden"
            onClick={() => setShowSelections((prev) => !prev)}
          >
            {showSelections ? "Hide selected cards" : "Show selected cards"}
          </button>

          <div className={`mt-3 gap-2 overflow-x-auto pb-1 ${showSelections ? "flex" : "hidden"} sm:flex sm:flex-wrap sm:overflow-visible sm:pb-0`}>
            {cards.map((card) => (
              <span
                key={card.id}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <span className="max-w-[180px] truncate">{card.name}</span>
                <button
                  type="button"
                  className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => onRemoveCard(card.id)}
                  aria-label={`Remove ${card.name} from comparison`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={onClear}>
            Clear
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={compareDisabled}
            onClick={onCompare}
          >
            <GitCompare className="size-4" aria-hidden />
            Compare cards
          </Button>
        </div>
      </div>
    </div>
  )
}
