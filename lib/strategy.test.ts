import { describe, expect, it } from "vitest"
import { computeStrategyViews } from "@/lib/strategy"
import type { AnnualFeeMode, MonthlySpend, SpendCategoryId } from "@/lib/types"

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

describe("pooling-aware CPP behavior", () => {
  it("values Freedom at 1.0cpp when not pooled and higher when paired with Sapphire", () => {
    const monthlySpend = makeSpend({
      dining: 1000,
      groceries: 500,
      other: 500,
    })

    const viewsFreedomOnly = computeStrategyViews(monthlySpend, ["chase-freedom-unlimited"])
    const currFreedomOnly = viewsFreedomOnly.nextBestCard
    const effectiveCppFreedomOnly =
      currFreedomOnly.currentAnnualPoints > 0
        ? Math.round(
            (currFreedomOnly.currentAnnualDollars / currFreedomOnly.currentAnnualPoints) * 10000
          )
        : 0

    const viewsFreedomWithSapphire = computeStrategyViews(monthlySpend, [
      "chase-freedom-unlimited",
      "chase-sapphire-reserve",
    ])
    const currFreedomWithSapphire = viewsFreedomWithSapphire.nextBestCard
    const effectiveCppFreedomWithSapphire =
      currFreedomWithSapphire.currentAnnualPoints > 0
        ? Math.round(
            (currFreedomWithSapphire.currentAnnualDollars /
              currFreedomWithSapphire.currentAnnualPoints) *
              10000
          )
        : 0

    expect(effectiveCppFreedomOnly).toBe(100)
    expect(effectiveCppFreedomWithSapphire).toBeGreaterThan(100)
  })

  it("prefers consumer cards over business cards when best-single-card value is tied", () => {
    const monthlySpend = makeSpend({
      other: 2000,
    })

    const views = computeStrategyViews(monthlySpend, [])
    const bestSingle = views.bestSingleCard.recommendedCard

    expect(bestSingle).not.toBeNull()
    if (!bestSingle) return

    expect(bestSingle.id).not.toBe("capital-one-spark-miles-for-business")
  })

  it("values Citi pooling-only cards higher when paired with Strata Premier", () => {
    const monthlySpend = makeSpend({
      dining: 800,
      groceries: 600,
      other: 600,
    })

    const viewsDoubleCashOnly = computeStrategyViews(monthlySpend, ["citi-double-cash-card"])
    const currDoubleCashOnly = viewsDoubleCashOnly.nextBestCard
    const effectiveCppDoubleCashOnly =
      currDoubleCashOnly.currentAnnualPoints > 0
        ? Math.round(
            (currDoubleCashOnly.currentAnnualDollars / currDoubleCashOnly.currentAnnualPoints) *
              10000
          )
        : 0

    const viewsDoubleCashWithStrata = computeStrategyViews(monthlySpend, [
      "citi-double-cash-card",
      "citi-strata-premier-card",
    ])
    const currDoubleCashWithStrata = viewsDoubleCashWithStrata.nextBestCard
    const effectiveCppDoubleCashWithStrata =
      currDoubleCashWithStrata.currentAnnualPoints > 0
        ? Math.round(
            (currDoubleCashWithStrata.currentAnnualDollars /
              currDoubleCashWithStrata.currentAnnualPoints) *
              10000
          )
        : 0

    expect(effectiveCppDoubleCashOnly).toBe(100)
    expect(effectiveCppDoubleCashWithStrata).toBeGreaterThan(100)
  })
})

describe("AnnualFeeMode behavior", () => {
  it("feeMode defaults to 'full' and includes fee in results", () => {
    const monthlySpend = makeSpend({ dining: 1000, other: 500 })
    const views = computeStrategyViews(monthlySpend, [])
    expect(views.nextBestCard.feeMode).toBe("full")
    expect(views.bestSingleCard.feeMode).toBe("full")
    expect(views.bestEcosystem.feeMode).toBe("full")
  })

  it("feeMode 'none' zeroes out annual fees in all views", () => {
    const monthlySpend = makeSpend({ dining: 1000, travel: 500, other: 500 })
    const views = computeStrategyViews(monthlySpend, [], "none")
    expect(views.nextBestCard.feeMode).toBe("none")
    expect(views.nextBestCard.currentAnnualFee).toBe(0)
    expect(views.bestSingleCard.currentAnnualFee).toBe(0)
    expect(views.bestEcosystem.recommendedPortfolio?.annualFee).toBe(0)
  })

  it("feeMode 'none' makes netAnnualValue equal annualDollars for ecosystem", () => {
    const monthlySpend = makeSpend({ dining: 1000, travel: 500, other: 500 })
    const views = computeStrategyViews(monthlySpend, [], "none")
    const portfolio = views.bestEcosystem.recommendedPortfolio
    expect(portfolio).toBeDefined()
    if (portfolio) {
      expect(portfolio.netAnnualValue).toBe(portfolio.annualDollars)
    }
  })

  it("feeMode 'none' can pick a different card than 'full' for high-fee scenarios", () => {
    const monthlySpend = makeSpend({
      dining: 500,
      groceries: 400,
      travel: 200,
      other: 300,
    })
    const viewsFull = computeStrategyViews(monthlySpend, [], "full")
    const viewsNone = computeStrategyViews(monthlySpend, [], "none")

    expect(viewsNone.bestSingleCard.recommendedPortfolio?.annualFee).toBe(0)
    expect(
      viewsNone.bestSingleCard.recommendedPortfolio?.netAnnualValue
    ).toBeGreaterThanOrEqual(
      viewsFull.bestSingleCard.recommendedPortfolio?.netAnnualValue ?? -Infinity
    )
  })

  it("feeMode 'none' zeroes netAdditionalFee on nextBestCard", () => {
    const monthlySpend = makeSpend({ dining: 1000, other: 500 })
    const views = computeStrategyViews(monthlySpend, [], "none")
    expect(views.nextBestCard.netAdditionalFee).toBe(0)
  })
})
