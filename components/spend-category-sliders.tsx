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
  { id: "travel", label: "Travel", icon: Plane },
  { id: "dining", label: "Dining", icon: UtensilsCrossed },
  { id: "groceries", label: "Groceries", icon: ShoppingCart },
  { id: "gasEv", label: "Gas & EV", icon: Fuel },
  { id: "streamingEntertainment", label: "Streaming & Entertainment", icon: Tv },
  { id: "drugstores", label: "Drugstores", icon: Pill },
  { id: "rentMortgage", label: "Rent & Mortgage", icon: Home },
  { id: "other", label: "Other", icon: CircleDollarSign },
] as const

const BASE_SLIDER_MAX = 5000
const SLIDER_STEP = 50

type Props = {
  totalSpend: number
  values: Record<string, number>
  onChange: (id: string, value: number) => void
}

export function SpendCategorySliders({ totalSpend, values, onChange }: Props) {
  const highestSelectedValue = Object.values(values).reduce((max, value) => {
    return typeof value === "number" && value > max ? value : max
  }, 0)

  // Grow the slider ceiling as users approach/exceed the default range.
  const sliderMax =
    highestSelectedValue >= BASE_SLIDER_MAX
      ? Math.ceil((highestSelectedValue + 1000) / 1000) * 1000
      : BASE_SLIDER_MAX

  return (
    <div className="space-y-8">
      {CATEGORIES.map(({ id, label, icon: Icon }) => {
        const value = values[id] ?? 0
        const pct = totalSpend > 0 ? Math.round((value / totalSpend) * 100) : 0
        return (
          <div key={id} className="space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <label htmlFor={id} className="flex min-w-0 flex-1 items-center gap-2 font-medium text-foreground">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                {label}
              </label>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                }).format(value)}
                {totalSpend > 0 && (
                  <span className="ml-1.5 text-muted-foreground/80">({pct}%)</span>
                )}
              </span>
            </div>
            <input
              id={id}
              type="range"
              min={0}
              max={sliderMax}
              step={SLIDER_STEP}
              value={value}
              onChange={(e) => onChange(id, Number(e.target.value))}
              className={cn(
                "h-2.5 w-full min-w-0 appearance-none rounded-full bg-secondary",
                "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer",
                "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer"
              )}
            />
          </div>
        )
      })}
    </div>
  )
}
