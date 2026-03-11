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
  compareCardIds: string[]
  brandSpends: BrandSpends
} {
  if (typeof window === "undefined") {
    return {
      monthlySpend: { ...DEFAULT_MONTHLY_SPEND },
      walletCardIds: [],
      compareCardIds: [],
      brandSpends: {},
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        monthlySpend: { ...DEFAULT_MONTHLY_SPEND },
        walletCardIds: [],
        compareCardIds: [],
        brandSpends: {},
      }
    }
    const parsed = JSON.parse(raw) as {
      monthlySpend?: Partial<MonthlySpend>
      walletCardIds?: string[]
      compareCardIds?: string[]
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
      compareCardIds: Array.isArray(parsed.compareCardIds) ? parsed.compareCardIds.slice(0, 3) : [],
      brandSpends: parsed.brandSpends && typeof parsed.brandSpends === "object" ? parsed.brandSpends : {},
    }
  } catch {
    return {
      monthlySpend: { ...DEFAULT_MONTHLY_SPEND },
      walletCardIds: [],
      compareCardIds: [],
      brandSpends: {},
    }
  }
}

function saveState(state: {
  monthlySpend: MonthlySpend
  walletCardIds: string[]
  compareCardIds: string[]
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
  compareCardIds: string[]
  brandSpends: BrandSpends
}

interface PointPathContextValue extends PointPathState {
  hydrated: boolean
  setMonthlySpend: (next: MonthlySpend | ((prev: MonthlySpend) => MonthlySpend)) => void
  setWalletCardIds: (next: string[] | ((prev: string[]) => string[])) => void
  setCompareCardIds: (next: string[] | ((prev: string[]) => string[])) => void
  setBrandSpends: (next: BrandSpends | ((prev: BrandSpends) => BrandSpends)) => void
  addWalletCard: (cardId: string) => void
  removeWalletCard: (cardId: string) => void
  toggleCompareCard: (cardId: string) => void
  removeCompareCard: (cardId: string) => void
  clearCompareCards: () => void
  updateCategorySpend: (categoryId: string, value: number) => void
  updateBrandSpend: (brandId: string, value: number | null) => void
}

const PointPathContext = createContext<PointPathContextValue | null>(null)

function normalizeCompareCardIds(ids: string[]): string[] {
  return Array.from(new Set(ids)).slice(0, 3)
}

export function PointPathProvider({ children }: { children: ReactNode }) {
  const [monthlySpend, setMonthlySpendState] = useState<MonthlySpend>(DEFAULT_MONTHLY_SPEND)
  const [walletCardIds, setWalletCardIdsState] = useState<string[]>([])
  const [compareCardIds, setCompareCardIdsState] = useState<string[]>([])
  const [brandSpends, setBrandSpendsState] = useState<BrandSpends>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const loaded = loadState()
      setMonthlySpendState(loaded.monthlySpend)
      setWalletCardIdsState(loaded.walletCardIds)
      setCompareCardIdsState(loaded.compareCardIds)
      setBrandSpendsState(loaded.brandSpends)
      setHydrated(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveState({ monthlySpend, walletCardIds, compareCardIds, brandSpends })
  }, [hydrated, monthlySpend, walletCardIds, compareCardIds, brandSpends])

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

  const setCompareCardIds = useCallback(
    (next: string[] | ((prev: string[]) => string[])) => {
      setCompareCardIdsState((prev) =>
        normalizeCompareCardIds(typeof next === "function" ? next(prev) : next)
      )
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

  const toggleCompareCard = useCallback((cardId: string) => {
    setCompareCardIdsState((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId)
      return prev.length >= 3 ? prev : [...prev, cardId]
    })
  }, [])

  const removeCompareCard = useCallback((cardId: string) => {
    setCompareCardIdsState((prev) => prev.filter((id) => id !== cardId))
  }, [])

  const clearCompareCards = useCallback(() => {
    setCompareCardIdsState([])
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
      compareCardIds,
      brandSpends,
      hydrated,
      setMonthlySpend,
      setWalletCardIds,
      setCompareCardIds,
      setBrandSpends,
      addWalletCard,
      removeWalletCard,
      toggleCompareCard,
      removeCompareCard,
      clearCompareCards,
      updateCategorySpend,
      updateBrandSpend,
    }),
    [
      monthlySpend,
      walletCardIds,
      compareCardIds,
      brandSpends,
      hydrated,
      setMonthlySpend,
      setWalletCardIds,
      setCompareCardIds,
      setBrandSpends,
      addWalletCard,
      removeWalletCard,
      toggleCompareCard,
      removeCompareCard,
      clearCompareCards,
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
