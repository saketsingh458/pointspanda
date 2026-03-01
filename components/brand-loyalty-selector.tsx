"use client"

import { useState, useMemo } from "react"
import { Search, Plus, X, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { BRANDS } from "@/lib/brands"
import { getCardsForBrand } from "@/lib/cards"

type Props = {
  selectedBrands: Record<string, number>
  onChange: (brandId: string, value: number | null) => void
}

export function BrandLoyaltySelector({ selectedBrands, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState("")

  const addedBrandIds = useMemo(() => Object.keys(selectedBrands), [selectedBrands])
  const addedBrands = useMemo(
    () => BRANDS.filter((b) => addedBrandIds.includes(b.id)),
    [addedBrandIds]
  )

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return BRANDS.filter(
      (b) =>
        !addedBrandIds.includes(b.id) &&
        (!q || b.name.toLowerCase().includes(q))
    )
  }, [searchQuery, addedBrandIds])

  const addBrand = (id: string) => {
    onChange(id, 0)
    setSearchQuery("")
  }

  const removeAddedBrand = (id: string) => {
    onChange(id, null)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Search to add brands you use often, then enter your estimated monthly spend. We’ll show credit cards for that brand from our catalog (updated from current issuer terms).
      </p>

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search to add brands (e.g. Amazon, Delta, Marriott...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search to add brands"
          />
        </div>
        {searchResults.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md">
            {searchResults.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => addBrand(b.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
                >
                  <span className="truncate">{b.name}</span>
                  <Plus className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">
            {searchQuery.trim()
              ? "No matching brands, or already added."
              : "Type to search and add brands."}
          </p>
        )}
      </div>

      {addedBrands.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Your brands</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {addedBrands.map((b) => {
              const cardsForBrand = getCardsForBrand(b.id)
              return (
                <div
                  key={b.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border px-4 py-3 transition-colors",
                    (selectedBrands[b.id] ?? 0) > 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-foreground">{b.name}</span>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">$</span>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          placeholder="0"
                          value={(selectedBrands[b.id] ?? 0) || ""}
                          onChange={(e) => {
                            const raw = e.target.value
                            if (raw === "") {
                              onChange(b.id, 0)
                              return
                            }
                            const num = Number(raw)
                            onChange(b.id, Number.isNaN(num) ? 0 : Math.max(0, num))
                          }}
                          className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-right text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <span className="text-muted-foreground">/mo</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAddedBrand(b.id)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Remove ${b.name}`}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                  {cardsForBrand.length > 0 && (
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CreditCard className="size-3.5" aria-hidden />
                        Cards for {b.name}
                      </p>
                      <ul className="space-y-1">
                        {cardsForBrand.map((card) => (
                          <li key={card.id} className="text-xs text-foreground">
                            <span className="font-medium">{card.name}</span>
                            <span className="ml-1.5 text-muted-foreground">
                              ${card.annualFee}/yr
                              {card.signUpBonus != null && ` · ${(card.signUpBonus / 1000).toFixed(0)}K bonus`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
