"use client"

import {
  Plane,
  UtensilsCrossed,
  ShoppingCart,
  Fuel,
  Tv,
  Pill,
  Home,
  CircleDollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "travel", label: "Travel", shortLabel: "Travel", icon: Plane },
  { id: "dining", label: "Dining", shortLabel: "Dining", icon: UtensilsCrossed },
  { id: "groceries", label: "Groceries", shortLabel: "Groceries", icon: ShoppingCart },
  { id: "gasEv", label: "Gas & EV", shortLabel: "Gas/EV", icon: Fuel },
  { id: "streamingEntertainment", label: "Streaming", shortLabel: "Stream", icon: Tv },
  { id: "drugstores", label: "Drugstores", shortLabel: "Drugs", icon: Pill },
  { id: "rentMortgage", label: "Rent/Mortgage", shortLabel: "Rent", icon: Home },
  { id: "other", label: "Other", shortLabel: "Other", icon: CircleDollarSign },
] as const

const SLIDER_MAX = 5000
const SLIDER_STEP = 50

type Props = {
  totalSpend: number
  values: Record<string, number>
  onChange: (id: string, value: number) => void
}

export function SpendCategorySliders({ totalSpend, values, onChange }: Props) {
  return (
    <div className="space-y-5 md:space-y-6">
      {CATEGORIES.map(({ id, label, shortLabel, icon: Icon }) => {
        const value = values[id] ?? 0
        const pct = totalSpend > 0 ? Math.round((value / totalSpend) * 100) : 0
        const fillPercent = Math.min(100, (value / SLIDER_MAX) * 100)
        
        return (
          <div key={id} className="space-y-2 md:space-y-3">
            <div className="flex items-center justify-between gap-2 text-sm md:gap-4">
              <label htmlFor={id} className="flex min-w-0 flex-1 items-center gap-1.5 font-medium text-foreground md:gap-2">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="md:hidden">{shortLabel}</span>
                <span className="hidden md:inline">{label}</span>
              </label>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground md:text-base">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                }).format(value)}
                {totalSpend > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground md:ml-1.5 md:text-sm">({pct}%)</span>
                )}
              </span>
            </div>
            
            {/* Custom slider with fill indicator */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 z-0 rounded-full bg-primary/20" style={{ width: `${fillPercent}%` }} />
              <input
                id={id}
                type="range"
                min={0}
                max={SLIDER_MAX}
                step={SLIDER_STEP}
                value={value}
                onChange={(e) => onChange(id, Number(e.target.value))}
                className={cn(
                  "relative z-10 h-3 w-full min-w-0 appearance-none rounded-full bg-secondary md:h-2.5",
                  // Larger touch target on mobile
                  "[&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-110",
                  "[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer",
                  "md:[&::-webkit-slider-thumb]:size-5 md:[&::-moz-range-thumb]:size-5"
                )}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
