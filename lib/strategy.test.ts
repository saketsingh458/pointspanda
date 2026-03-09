import { describe, expect, it } from "vitest"
import { computeStrategyViews } from "@/lib/strategy"
import type { MonthlySpend, SpendCategoryId } from "@/lib/types"

function makeSpend(
  overrides: Partial<Record<SpendCategoryId, number>> = {}
): MonthlySpend {
  return {
    travel: 0,
    dining: 0,
    groceries: 0,
    gasEv: 0,
    streamingEntertainment: 0,
    drugstores: 0,
    rentMortgage: 0,
    other: 0,
    ...overrides,
  }
}

describe("computeStrategyViews scenario coverage", () => {
  const scenarios = [
    {
      name: "rent-heavy empty wallet",
      walletCardIds: [],
      monthlySpend: makeSpend({
        rentMortgage: 3500,
        dining: 300,
        groceries: 250,
        other: 200,
      }),
      expected: {
        nextBestCardId: "wells-fargo-active-cash",
        bestSingleCardId: "wells-fargo-active-cash",
        ecosystemId: "wells-fargo-rewards",
      },
    },
    {
      name: "broad everyday empty wallet",
      walletCardIds: [],
      monthlySpend: makeSpend({
        dining: 1200,
        groceries: 900,
        travel: 300,
        other: 600,
      }),
      expected: {
        nextBestCardId: "capital-one-savor-cash-rewards",
        bestSingleCardId: "capital-one-savor-cash-rewards",
        ecosystemId: "capital-one-miles",
      },
    },
    {
      name: "existing chase wallet upgrade",
      walletCardIds: ["chase-sapphire-preferred-card"],
      monthlySpend: makeSpend({
        travel: 250,
        dining: 700,
        drugstores: 150,
        other: 1000,
      }),
      expected: {
        nextBestCardId: "wells-fargo-active-cash",
        bestSingleCardId: "chase-freedom-unlimited",
        ecosystemId: "chase-ultimate-rewards",
      },
    },
    {
      name: "zero-spend no-change branch",
      walletCardIds: [],
      monthlySpend: makeSpend(),
      expected: {
        nextBestCardId: null,
      },
    },
    {
      name: "mixed-travel ecosystem sanity",
      walletCardIds: ["citi-double-cash-card"],
      monthlySpend: makeSpend({
        travel: 600,
        dining: 800,
        groceries: 600,
        drugstores: 150,
        other: 900,
      }),
      expected: {
        nextBestCardId: "chase-freedom-unlimited",
        bestSingleCardId: "chase-freedom-unlimited",
        ecosystemId: "chase-ultimate-rewards",
      },
    },
  ] as const

  it.each(scenarios)(
    "returns coherent recommendations for %s",
    ({ name, monthlySpend, walletCardIds, expected }) => {
      const views = computeStrategyViews(monthlySpend, walletCardIds)

      expect(views.nextBestCard.categoryRows).toHaveLength(8)
      expect(views.bestSingleCard.categoryRows).toHaveLength(8)
      expect(views.bestEcosystem.categoryRows).toHaveLength(8)

      expect(views.bestSingleCard.recommendedCard).not.toBeNull()
      expect(views.bestEcosystem.recommendedCards.length).toBeGreaterThan(0)
      expect(
        views.bestEcosystem.maxPotentialAnnualDollars
      ).toBeGreaterThanOrEqual(views.bestSingleCard.maxPotentialAnnualDollars)
      expect(
        views.bestEcosystem.recommendedPortfolio?.netAnnualValue ?? -Infinity
      ).toBeGreaterThanOrEqual(
        views.bestEcosystem.alternativeOptions?.[0]?.portfolio.netAnnualValue ?? -Infinity
      )

      if ("nextBestCardId" in expected) {
        expect(views.nextBestCard.recommendedCard?.id ?? null).toBe(expected.nextBestCardId)
      }
      if ("bestSingleCardId" in expected) {
        expect(views.bestSingleCard.recommendedCard?.id ?? null).toBe(expected.bestSingleCardId)
      }
      if ("ecosystemId" in expected) {
        expect(views.bestEcosystem.ecosystemId ?? null).toBe(expected.ecosystemId)
      }
    }
  )
})
