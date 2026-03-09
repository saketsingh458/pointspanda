"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, ExternalLink } from "lucide-react"
import type { Card } from "@/lib/types"
import { buildCompareSections } from "@/lib/card-compare"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CARD_ART_PLACEHOLDER = "/cards/placeholder.svg"

type Props = {
  cards: Card[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemoveCard: (cardId: string) => void
  onOpenCardDetails: (card: Card) => void
}

function isValidImageSrc(src: string | undefined): boolean {
  if (!src || typeof src !== "string") return false
  const trimmed = src.trim()
  if (trimmed.startsWith("/")) return true

  try {
    new URL(trimmed)
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
  } catch {
    return false
  }
}

function CompareCardHeader({
  card,
  onRemoveCard,
  onOpenCardDetails,
}: {
  card: Card
  onRemoveCard: (cardId: string) => void
  onOpenCardDetails: (card: Card) => void
}) {
  const [imageError, setImageError] = useState(false)
  const hasImage = isValidImageSrc(card.imageUrl) && !imageError

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm">
      <div className="relative aspect-[1.586/1] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {hasImage ? (
          <Image
            src={card.imageUrl ?? CARD_ART_PLACEHOLDER}
            alt={card.name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 260px, 320px"
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            />
            <div className="absolute left-4 top-4 h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
            <div className="absolute inset-x-4 bottom-4">
              <p className="truncate text-sm font-semibold text-white/95">{card.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">
                {card.issuer ?? "Card"}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight text-foreground">{card.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {card.issuer ?? card.synergyEcosystem ?? "Credit card"}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          onClick={() => onOpenCardDetails(card)}
        >
          <ExternalLink className="size-4" aria-hidden />
          View details
        </Button>
        {card.applyUrl ? (
          <Button asChild className="w-full rounded-xl">
            <Link href={card.applyUrl} target="_blank" rel="noopener noreferrer">
              Learn more
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-xl"
          onClick={() => onRemoveCard(card.id)}
        >
          Remove from compare
        </Button>
      </div>
    </div>
  )
}

function getCardGridClassName(cardCount: number): string {
  if (cardCount >= 3) return "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
  if (cardCount === 2) return "grid grid-cols-1 gap-3 md:grid-cols-2"
  return "grid grid-cols-1 gap-3"
}

export function CardCompareDialog({
  cards,
  open,
  onOpenChange,
  onRemoveCard,
  onOpenCardDetails,
}: Props) {
  const sections = useMemo(() => buildCompareSections(cards), [cards])
  const cardGridClassName = getCardGridClassName(cards.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[min(1100px,96vw)] max-w-none gap-0 rounded-3xl border border-border/60 p-0">
        <DialogClose />
        <DialogHeader className="border-b border-border/70 pb-5 pr-14">
          <DialogTitle>Compare cards</DialogTitle>
          <DialogDescription>
            See how your selected cards stack up across fees, bonuses, earnings, credits, and transfer partners.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <section className="-mx-4 -mt-2 border-b border-border/70 bg-background px-4 py-4 sm:-mx-6 sm:px-6 sm:py-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Selected cards
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep these headers pinned while you scroll through the comparison.
                </p>
              </div>
            </div>

            <div className={cardGridClassName}>
              {cards.map((card) => (
                <CompareCardHeader
                  key={card.id}
                  card={card}
                  onRemoveCard={onRemoveCard}
                  onOpenCardDetails={onOpenCardDetails}
                />
              ))}
            </div>
          </section>

          <div className="mt-6 space-y-6">
            {sections.map((section) => (
              <section
                key={section.id}
                className="rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5"
              >
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {section.title}
                  </p>
                </div>

                <div className="space-y-4">
                  {section.rows.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-border/60 bg-background p-4"
                    >
                      <p className="text-sm font-semibold text-foreground">{row.label}</p>

                      <div className={cn("mt-3", cardGridClassName)}>
                        {row.values.map((value, index) => (
                          <div
                            key={`${row.id}-${cards[index]?.id ?? index}`}
                            className={cn(
                              "rounded-2xl border border-border/60 bg-card p-4",
                              value.items && value.items.length > 0 && "bg-muted/15"
                            )}
                          >
                            <p className="text-base font-semibold text-foreground">
                              {value.primary ?? "—"}
                            </p>
                            {value.secondary ? (
                              <p className="mt-1 text-sm text-muted-foreground">{value.secondary}</p>
                            ) : null}
                            {value.items && value.items.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {value.items.map((item) => (
                                  <div
                                    key={item}
                                    className="rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                                  >
                                    {item}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
