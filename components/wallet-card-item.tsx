"use client"

import { useState, type ComponentType } from "react"
import Image from "next/image"
import {
  Building2,
  CreditCard,
  Fuel,
  GitCompare,
  Pill,
  Plane,
  ShoppingCart,
  Tv,
  UtensilsCrossed,
  X,
} from "lucide-react"
import type { Card as CardType } from "@/lib/types"
import { CATEGORY_LABELS } from "@/lib/cards"
import { SPEND_CATEGORIES, type SpendCategoryId } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CARD_ART_PLACEHOLDER = "/cards/placeholder.svg"

/** Only use Image for valid URLs or relative paths; data may contain "N/A" or other non-URLs. */
function isValidImageSrc(src: string | undefined): boolean {
  if (!src || typeof src !== "string") return false
  const t = src.trim()
  if (t.startsWith("/")) return true
  try {
    new URL(t)
    return t.startsWith("http://") || t.startsWith("https://")
  } catch {
    return false
  }
}

type Props = {
  card: CardType
  onRemove: () => void
  onCardClick?: () => void
  onCompareToggle?: () => void
  isCompared?: boolean
  compareDisabled?: boolean
  className?: string
}

/** All earn rates by category for wallet tile (with optional cap for summary). */
function getAllEarns(
  card: CardType
): { id: SpendCategoryId; label: string; multiplier: number; cap?: number }[] {
  const base = card.baseRate ?? card.categoryMultipliers.other ?? 0
  return SPEND_CATEGORIES.map((cat) => ({
    id: cat,
    label: CATEGORY_LABELS[cat],
    multiplier: cat === "other" ? base : (card.categoryMultipliers[cat] ?? 0),
    cap: card.categoryCaps?.[cat],
  }))
}

function formatCreditLabel(name: string): string {
  return name
    .replace(/\b(credit|statement|annual|monthly)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Annual credits list for pill UI (e.g. "$300 Travel", "$120 Lyft"). */
function getStatementCreditsPills(card: CardType): string[] {
  const list = card.statementCredits
  if (!list || list.length === 0) return []
  return list.map((sc) => {
    const cleanName = formatCreditLabel(sc.name) || sc.name
    if (sc.amount <= 0) return cleanName
    return `$${sc.amount.toLocaleString()} ${cleanName}`.trim()
  })
}

export function WalletCardItem({
  card,
  onRemove,
  onCardClick,
  onCompareToggle,
  isCompared = false,
  compareDisabled = false,
  className,
}: Props) {
  const allEarns = getAllEarns(card)
  const statementCredits = getStatementCreditsPills(card)
  const visibleCredits = statementCredits.slice(0, 2)
  const remainingCreditsCount = Math.max(0, statementCredits.length - visibleCredits.length)
  const imageUrl = isValidImageSrc(card.imageUrl) ? card.imageUrl! : CARD_ART_PLACEHOLDER
  const [imgError, setImgError] = useState(false)
  const usePlaceholder = imgError || !isValidImageSrc(card.imageUrl)

  const categoryIcons: Record<SpendCategoryId, ComponentType<{ className?: string }>> = {
    travel: Plane,
    dining: UtensilsCrossed,
    groceries: ShoppingCart,
    gasEv: Fuel,
    streamingEntertainment: Tv,
    drugstores: Pill,
    rentMortgage: Building2,
    other: CreditCard,
  }

  return (
    <div
      role={onCardClick ? "button" : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onClick={onCardClick}
      onKeyDown={
        onCardClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onCardClick()
              }
            }
          : undefined
      }
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        isCompared && "border-primary/60 ring-1 ring-primary/25",
        onCardClick &&
          "cursor-pointer hover:shadow-lg focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Card art or credit-card-style visual */}
      <div className="relative aspect-[1.586/1] w-full min-h-[150px] overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {usePlaceholder ? (
          <>
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="truncate text-sm font-semibold tracking-wide text-white/95 drop-shadow-sm">
                {card.name}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
                In your wallet
              </p>
            </div>
          </>
        ) : (
          <Image
            src={imageUrl}
            alt={card.name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, 50vw"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute right-2 top-2 flex items-center gap-2">
          {onCompareToggle && (
            <Button
              type="button"
              variant={isCompared ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "rounded-full px-3",
                isCompared
                  ? "bg-white text-slate-900 hover:bg-white/90"
                  : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
              )}
              aria-label={`${isCompared ? "Remove" : "Add"} ${card.name} ${isCompared ? "from" : "to"} comparison`}
              disabled={compareDisabled && !isCompared}
              onClick={(e) => {
                e.stopPropagation()
                onCompareToggle()
              }}
            >
              <GitCompare className="size-4" />
              {isCompared ? "Comparing" : "Compare"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
            aria-label={`Remove ${card.name}`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Card details - compact on mobile, expanded on desktop */}
      <div className="flex flex-col gap-4 bg-muted/35 p-4 md:gap-6 md:p-5">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold leading-tight tracking-tight text-foreground md:text-2xl lg:text-3xl">
              {card.name}
            </h3>
            {card.issuer && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground md:mt-1 md:text-sm">{card.issuer}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:text-xs">
              Annual Fee
            </p>
            <p className="text-xl font-bold leading-none tabular-nums text-foreground md:text-3xl lg:text-4xl">
              {card.annualFee === 0 ? "$0" : `$${card.annualFee}`}
            </p>
          </div>
        </div>

        {/* Icon-based earning rates - compact grid on mobile */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:mb-3 md:text-xs">
            Earning Rates
          </p>
          <ul className="grid grid-cols-4 gap-1.5 md:gap-2">
            {allEarns.map(({ id, label, multiplier, cap }) => {
              const Icon = categoryIcons[id]
              return (
                <li
                  key={id}
                  className="rounded-xl bg-background/85 px-1.5 py-2 text-center shadow-sm md:rounded-2xl md:px-2 md:py-3"
                >
                  <div className="mx-auto mb-1 flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 md:mb-2 md:size-9">
                    <Icon className="size-3 md:size-4" />
                  </div>
                  <p className="text-lg font-bold leading-none tabular-nums text-foreground md:text-[2rem]">
                    {multiplier}x
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium text-muted-foreground md:mt-1 md:text-xs">{label}</p>
                  {cap != null && (
                    <p className="mt-0.5 hidden text-[10px] leading-tight text-muted-foreground md:block">
                      ${cap.toLocaleString()}/mo cap
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Credits as compact rounded pills - hidden on mobile if too many */}
        {statementCredits.length > 0 && (
          <div className="hidden md:block">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:mb-3 md:text-xs">
              Credits
            </p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {visibleCredits.map((credit, index) => (
                <span
                  key={`${credit}-${index}`}
                  className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground md:px-4 md:py-1.5 md:text-sm"
                >
                  {credit}
                </span>
              ))}
              {remainingCreditsCount > 0 && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground md:px-4 md:py-1.5 md:text-sm">
                  +{remainingCreditsCount} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mobile-optimized compare button */}
        {onCompareToggle && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/90 px-3 py-2.5 md:gap-3 md:rounded-2xl md:px-4 md:py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground md:text-sm">Compare cards</p>
              <p className="hidden text-xs text-muted-foreground sm:block md:text-sm">
                {isCompared
                  ? "In your compare tray"
                  : compareDisabled
                    ? "Remove a card first"
                    : "Add to compare"}
              </p>
            </div>
            <Button
              type="button"
              variant={isCompared ? "secondary" : "outline"}
              size="sm"
              className="h-8 shrink-0 rounded-lg px-2.5 text-xs md:h-9 md:rounded-xl md:px-3 md:text-sm"
              disabled={compareDisabled && !isCompared}
              onClick={(e) => {
                e.stopPropagation()
                onCompareToggle()
              }}
            >
              <GitCompare className="size-3.5 md:size-4" />
              {isCompared ? "Selected" : "Compare"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
