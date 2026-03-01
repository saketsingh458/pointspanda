"use client"

import { X } from "lucide-react"
import type { Card as CardType } from "@/lib/types"
import { CATEGORY_LABELS } from "@/lib/cards"
import { SPEND_CATEGORIES } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  card: CardType
  onRemove: () => void
  className?: string
}

/** Format earn accelerators: only categories with multiplier > 1, e.g. "Travel 4x · Dining 3x" */
function getEarnAccelerators(card: CardType): string[] {
  return SPEND_CATEGORIES.filter((cat) => (card.categoryMultipliers[cat] ?? 0) > 1).map(
    (cat) => `${CATEGORY_LABELS[cat]} ${card.categoryMultipliers[cat]}x`
  )
}

export function WalletCardItem({ card, onRemove, className }: Props) {
  const accelerators = getEarnAccelerators(card)

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Card design: credit-card-style visual */}
      <div className="relative aspect-[1.586/1] w-full min-h-[140px] overflow-hidden rounded-t-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        />
        {/* Chip */}
        <div className="relative h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
        {/* Card name on the "card" */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="truncate text-sm font-semibold tracking-wide text-white/95 drop-shadow-sm">
            {card.name}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
            In your wallet
          </p>
        </div>
        {/* Remove button on card */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
          aria-label={`Remove ${card.name}`}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Card details */}
      <div className="flex flex-col gap-4 p-4">
        <div className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Annual fee</span>
            <span className="font-semibold tabular-nums text-foreground">
              {card.annualFee === 0 ? "$0" : `$${card.annualFee}/yr`}
            </span>
          </div>

          {accelerators.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Earn accelerators
              </p>
              <p className="text-foreground">
                {accelerators.map((acc, i) => (
                  <span key={acc}>
                    {i > 0 && <span className="mx-1.5 text-muted-foreground">·</span>}
                    <span className="font-medium">{acc}</span>
                  </span>
                ))}
              </p>
            </div>
          )}

          {card.benefits.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Key benefits
              </p>
              <ul className="flex flex-wrap gap-2">
                {card.benefits.map((benefit) => (
                  <li key={benefit}>
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
