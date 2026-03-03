"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { MonthlySpend, BrandSpends } from "@/lib/types"
import { SPEND_CATEGORIES } from "@/lib/types"

const STORAGE_KEY = "pointpath-state"

const DEFAULT_MONTHLY_SPEND: MonthlySpend = {
  travel: 0,
  dining: 0,
  groceries: 0,
  gasEv: 0,
  streamingEntertainment: 0,
  drugstores: 0,
  rentMortgage: 0,
  other: 0,
}

function loadState(): {
  monthlySpend: MonthlySpend
  walletCardIds: string[]
  brandSpends: BrandSpends
} {
  if (typeof window === "undefined") {
    return {
      monthlySpend: { ...DEFAULT_MONTHLY_SPEND },
      walletCardIds: [],
      brandSpends: {},
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { monthlySpend: { ...DEFAULT_MONTHLY_SPEND }, walletCardIds: [], brandSpends: {} }
    const parsed = JSON.parse(raw) as {
      monthlySpend?: Partial<MonthlySpend>
      walletCardIds?: string[]
      brandSpends?: BrandSpends
    }
    const monthlySpend: MonthlySpend = { ...DEFAULT_MONTHLY_SPEND }
    for (const cat of SPEND_CATEGORIES) {
      if (typeof parsed.monthlySpend?.[cat] === "number") {
        monthlySpend[cat] = parsed.monthlySpend[cat]
      }
    }
    return {
      monthlySpend,
      walletCardIds: Array.isArray(parsed.walletCardIds) ? parsed.walletCardIds : [],
      brandSpends: parsed.brandSpends && typeof parsed.brandSpends === "object" ? parsed.brandSpends : {},
    }
  } catch {
    return { monthlySpend: { ...DEFAULT_MONTHLY_SPEND }, walletCardIds: [], brandSpends: {} }
  }
}

function saveState(state: {
  monthlySpend: MonthlySpend
  walletCardIds: string[]
  brandSpends: BrandSpends
}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

interface PointPathState {
  monthlySpend: MonthlySpend
  walletCardIds: string[]
  brandSpends: BrandSpends
}

interface PointPathContextValue extends PointPathState {
  setMonthlySpend: (next: MonthlySpend | ((prev: MonthlySpend) => MonthlySpend)) => void
  setWalletCardIds: (next: string[] | ((prev: string[]) => string[])) => void
  setBrandSpends: (next: BrandSpends | ((prev: BrandSpends) => BrandSpends)) => void
  addWalletCard: (cardId: string) => void
  removeWalletCard: (cardId: string) => void
  updateCategorySpend: (categoryId: string, value: number) => void
  updateBrandSpend: (brandId: string, value: number | null) => void
}

const PointPathContext = createContext<PointPathContextValue | null>(null)

export function PointPathProvider({ children }: { children: ReactNode }) {
  const [monthlySpend, setMonthlySpendState] = useState<MonthlySpend>(DEFAULT_MONTHLY_SPEND)
  const [walletCardIds, setWalletCardIdsState] = useState<string[]>([])
  const [brandSpends, setBrandSpendsState] = useState<BrandSpends>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const loaded = loadState()
    setMonthlySpendState(loaded.monthlySpend)
    setWalletCardIdsState(loaded.walletCardIds)
    setBrandSpendsState(loaded.brandSpends)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveState({ monthlySpend, walletCardIds, brandSpends })
  }, [hydrated, monthlySpend, walletCardIds, brandSpends])

  const setMonthlySpend = useCallback(
    (next: MonthlySpend | ((prev: MonthlySpend) => MonthlySpend)) => {
      setMonthlySpendState((prev) => (typeof next === "function" ? next(prev) : next))
    },
    []
  )

  const setWalletCardIds = useCallback(
    (next: string[] | ((prev: string[]) => string[])) => {
      setWalletCardIdsState((prev) => (typeof next === "function" ? next(prev) : next))
    },
    []
  )

  const setBrandSpends = useCallback(
    (next: BrandSpends | ((prev: BrandSpends) => BrandSpends)) => {
      setBrandSpendsState((prev) => (typeof next === "function" ? next(prev) : next))
    },
    []
  )

  const addWalletCard = useCallback((cardId: string) => {
    setWalletCardIdsState((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]))
  }, [])

  const removeWalletCard = useCallback((cardId: string) => {
    setWalletCardIdsState((prev) => prev.filter((id) => id !== cardId))
  }, [])

  const updateCategorySpend = useCallback((categoryId: string, value: number) => {
    setMonthlySpendState((prev) => {
      if (!(categoryId in prev)) return prev
      return { ...prev, [categoryId]: value }
    })
  }, [])

  const updateBrandSpend = useCallback((brandId: string, value: number | null) => {
    setBrandSpendsState((prev) => {
      if (value === null) {
        const next = { ...prev }
        delete next[brandId]
        return next
      }
      return { ...prev, [brandId]: value }
    })
  }, [])

  const value = useMemo<PointPathContextValue>(
    () => ({
      monthlySpend,
      walletCardIds,
      brandSpends,
      setMonthlySpend,
      setWalletCardIds,
      setBrandSpends,
      addWalletCard,
      removeWalletCard,
      updateCategorySpend,
      updateBrandSpend,
    }),
    [
      monthlySpend,
      walletCardIds,
      brandSpends,
      setMonthlySpend,
      setWalletCardIds,
      setBrandSpends,
      addWalletCard,
      removeWalletCard,
      updateCategorySpend,
      updateBrandSpend,
    ]
  )

  return (
    <PointPathContext.Provider value={value}>
      {children}
    </PointPathContext.Provider>
  )
}

export function usePointPath() {
  const ctx = useContext(PointPathContext)
  if (!ctx) {
    throw new Error("usePointPath must be used within PointPathProvider")
  }
  return ctx
}
