import {
  Building2,
  CircleDollarSign,
  Fuel,
  Pill,
  Plane,
  ShoppingCart,
  Tv,
  UtensilsCrossed,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { SpendCategoryId } from "@/lib/types"

export const CARD_ART_PLACEHOLDER = "/cards/placeholder.svg"

export const CATEGORY_ICONS: Record<SpendCategoryId, LucideIcon> = {
  travel: Plane,
  dining: UtensilsCrossed,
  groceries: ShoppingCart,
  gasEv: Fuel,
  streamingEntertainment: Tv,
  drugstores: Pill,
  rentMortgage: Building2,
  other: CircleDollarSign,
}

export function isValidImageSrc(src: string | undefined): boolean {
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
