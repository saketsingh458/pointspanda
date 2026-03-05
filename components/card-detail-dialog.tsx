"use client"

import { useState, type ComponentType } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  Plane,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react"
import type { Card as CardType } from "@/lib/types"
import { CATEGORY_LABELS } from "@/lib/cards"
import { SPEND_CATEGORIES, type SpendCategoryId } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const CARD_ART_PLACEHOLDER = "/cards/placeholder.svg"
const VISIBLE_CREDITS_DEFAULT = 3

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
  card: CardType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatPoints(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCpp(cents: number): string {
  const cpp = cents / 100
  const trimmed = Number.isInteger(cpp) ? cpp.toFixed(0) : cpp.toFixed(1)
  return `${trimmed}c/pt`
}

function getFrequencyMultiplier(freq: string): number {
  const normalized = freq.trim().toLowerCase()
  if (normalized === "annual" || normalized === "yearly") return 1
  if (normalized === "monthly") return 12
  if (normalized === "quarterly") return 4
  if (normalized === "semiannual" || normalized === "semi-annually") return 2
  if (normalized === "weekly") return 52
  if (normalized === "biweekly" || normalized === "bi-weekly") return 26
  if (normalized === "one-time") return 1
  const everyYears = normalized.match(/^every\s+(\d+)\s+years?$/)
  if (everyYears) {
    const years = Number(everyYears[1])
    return years > 0 ? 1 / years : 1
  }
  return 1
}

function annualizedCreditAmount(amount: number, frequency: string): number {
  return amount * getFrequencyMultiplier(frequency)
}

/** Earn details: all categories with per-channel rows; Other always shows base rate. */
function getEarnDisplayRows(card: CardType): {
  category: string
  categoryId: SpendCategoryId
  multiplier: number
  details?: { channel: string; multiplier: number; capAmount?: number }[]
}[] {
  const base = card.baseRate ?? card.categoryMultipliers.other ?? 0
  const rows: {
    category: string
    categoryId: SpendCategoryId
    multiplier: number
    details?: { channel: string; multiplier: number; capAmount?: number }[]
  }[] = []

  for (const cat of SPEND_CATEGORIES) {
    if (cat === "other") {
      rows.push({
        category: CATEGORY_LABELS.other,
        categoryId: "other",
        multiplier: base,
      })
      continue
    }
    const mult = card.categoryMultipliers[cat] ?? 0
    const details = card.categoryEarnDetails?.[cat]
    rows.push({
      category: CATEGORY_LABELS[cat],
      categoryId: cat,
      multiplier: mult,
      details:
        details && details.length > 0
          ? details.map((d) => ({
              channel: d.channel,
              multiplier: d.multiplier,
              capAmount: d.capAmount,
            }))
          : undefined,
    })
  }

  return rows
}

function iconForEarnLabel(label: string): ComponentType<{ className?: string }> {
  const normalized = label.toLowerCase()
  if (normalized.includes("travel") || normalized.includes("flight") || normalized.includes("hotel")) {
    return Plane
  }
  if (normalized.includes("dining") || normalized.includes("restaurant")) {
    return UtensilsCrossed
  }
  if (normalized.includes("portal") || normalized.includes("direct")) {
    return Star
  }
  return CreditCard
}

function sectionTitle(
  icon: ComponentType<{ className?: string }>,
  title: string
) {
  const Icon = icon
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Icon className="size-4" />
      </div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h3>
    </div>
  )
}

export function CardDetailDialog({ card, open, onOpenChange }: Props) {
  const [showAllCredits, setShowAllCredits] = useState(false)
  if (!card) return null

  const earnRows = getEarnDisplayRows(card)
  const imageUrl = isValidImageSrc(card.imageUrl) ? card.imageUrl! : CARD_ART_PLACEHOLDER
  const keyBenefits = card.benefits.slice(0, 6)
  const totalAnnualCredits = (card.statementCredits ?? []).reduce((sum, credit) => {
    return sum + annualizedCreditAmount(credit.amount, credit.frequency)
  }, 0)
  const hasMoreCredits =
    (card.statementCredits?.length ?? 0) > VISIBLE_CREDITS_DEFAULT
  const visibleCredits = showAllCredits
    ? (card.statementCredits ?? [])
    : (card.statementCredits ?? []).slice(0, VISIBLE_CREDITS_DEFAULT)

  const earningTiles = earnRows.flatMap(({ category, categoryId, multiplier, details }) => {
    if (!details || details.length === 0) {
      return [
        {
          key: categoryId,
          label: category,
          multiplier,
        },
      ]
    }
    return details.map((detail) => ({
      key: `${categoryId}-${detail.channel}`,
      label: detail.channel,
      multiplier: detail.multiplier,
    }))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(760px,95vw)] gap-0 overflow-hidden rounded-2xl border border-border/50 p-0">
        <DialogClose className="right-3 top-3 z-20 bg-black/30 text-white hover:bg-black/45 hover:text-white" />

        <DialogHeader className="p-0">
          <DialogTitle className="sr-only">{card.name} card details</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[1.586/1] w-full min-h-[170px] shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {isValidImageSrc(card.imageUrl) ? (
            <Image
              src={imageUrl}
              alt={card.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 512px) 100vw, 512px"
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
              <div className="absolute left-5 top-5 h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <p className="text-lg font-semibold tracking-wide text-white md:text-xl">
              {card.name}
            </p>
            {card.issuer && (
              <p className="mt-0.5 text-sm text-white/80">{card.issuer}</p>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto bg-background">
          <div className="grid grid-cols-2 border-b border-border">
            <div className="border-r border-border px-5 py-4">
              <p className="text-sm text-muted-foreground">
                Annual Fee
              </p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-foreground">
                {formatCurrency(card.annualFee)}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground">
                Total Credits
              </p>
              <p className="mt-1 text-5xl font-bold tracking-tight text-emerald-600">
                {formatCurrency(Math.round(totalAnnualCredits))}
              </p>
            </div>
          </div>

          <div className="space-y-7 px-5 py-6">
            {card.signUpBonus != null && (
              <section>
                {sectionTitle(Sparkles, "Welcome Offer")}
                <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4">
                  <p className="text-5xl font-bold tracking-tight text-foreground">
                    {formatPoints(card.signUpBonus)}
                    <span className="ml-2 text-3xl font-medium text-foreground/75">
                      {card.rewardCurrency ?? "points"}
                    </span>
                  </p>
                  {card.signUpBonusSpendRequirement != null &&
                    card.signUpBonusTimeframeMonths != null && (
                      <p className="mt-2 text-lg text-muted-foreground">
                        Spend {formatCurrency(card.signUpBonusSpendRequirement)} in the first{" "}
                        {card.signUpBonusTimeframeMonths} months
                      </p>
                    )}
                </div>
              </section>
            )}

            {earningTiles.length > 0 && (
              <section>
                {sectionTitle(Star, "Earning Rates")}
                <div className="grid gap-3 sm:grid-cols-2">
                  {earningTiles.map((tile) => {
                    const Icon = iconForEarnLabel(tile.label)
                    return (
                      <div
                        key={tile.key}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-4xl font-bold leading-none tracking-tight text-foreground">
                            {tile.multiplier}x
                          </p>
                          <p className="mt-1 truncate text-xl text-muted-foreground">
                            {tile.label}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {(card.pointsValueBaseCents != null || card.pointsValueMaxCents != null || card.synergyEcosystem) && (
              <section>
                {sectionTitle(CircleDollarSign, "Point Valuation")}
                <div className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3">
                  <div className="px-4 py-4 sm:border-r sm:border-border">
                    <p className="text-sm text-muted-foreground">Floor Value</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">
                      {card.pointsValueBaseCents != null ? formatCpp(card.pointsValueBaseCents) : "N/A"}
                    </p>
                  </div>
                  <div className="border-y border-border px-4 py-4 sm:border-x sm:border-y-0">
                    <p className="text-sm text-muted-foreground">Ceiling Value</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight text-emerald-600">
                      {card.pointsValueMaxCents != null ? formatCpp(card.pointsValueMaxCents) : "N/A"}
                    </p>
                  </div>
                  <div className="px-4 py-4">
                    <p className="text-sm text-muted-foreground">Ecosystem</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {card.synergyEcosystem ?? card.issuer ?? "N/A"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {(card.statementCredits?.length ?? 0) > 0 && (
              <section>
                {sectionTitle(CircleDollarSign, "Statement Credits")}
                <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
                  {visibleCredits.map((sc) => (
                    <div
                      key={`${sc.name}-${sc.amount}-${sc.frequency}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-foreground">{sc.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {sc.frequency}
                          {sc.deductsFromEligibleSpend && " · Deducts from eligible spend"}
                        </p>
                      </div>
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {formatCurrency(sc.amount)}
                      </p>
                    </div>
                  ))}
                </div>
                {hasMoreCredits && (
                  <button
                    type="button"
                    className="mt-3 w-full text-center text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                    onClick={() => setShowAllCredits((prev) => !prev)}
                  >
                    {showAllCredits ? "Show fewer credits" : `Show ${(card.statementCredits?.length ?? 0) - VISIBLE_CREDITS_DEFAULT} more credits`}
                  </button>
                )}
              </section>
            )}

            {(card.transferPartners?.length ?? 0) > 0 && (
              <section>
                {sectionTitle(RefreshCw, "Transfer Partners")}
                <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2">
                  {card.transferPartners?.map((partner) => (
                    <div
                      key={`${partner.name}-${partner.ratio}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3 py-2"
                    >
                      <p className="font-medium text-foreground">{partner.name}</p>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
                        {partner.ratio}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Partner lists and ratios can change, and transfer eligibility may depend on your card setup.
                </p>
              </section>
            )}

            {keyBenefits.length > 0 && (
              <section>
                {sectionTitle(Shield, "Other Benefits")}
                <div className="flex flex-wrap gap-2">
                  {keyBenefits.map((benefit) => (
                    <Badge
                      key={benefit}
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-sm font-medium"
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {(card.developerNotes || card.pointsValueNote) && (
              <section className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground">Note</p>
                <p className="mt-1 text-lg text-foreground">
                  {card.developerNotes ?? card.pointsValueNote}
                </p>
              </section>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {[card.rewardCurrency, card.synergyEcosystem].filter(Boolean).join(" · ")}
              </p>
              {card.applyUrl && (
                <Button asChild variant="outline" className="rounded-xl px-4">
                  <Link
                    href={card.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onOpenChange(false)}
                  >
                    Learn More
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>

            {card.lastUpdatedAt && (
              <p className="text-xs text-muted-foreground">
                Info updated{" "}
                {new Date(card.lastUpdatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
