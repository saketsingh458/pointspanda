import type { Card, SpendCategoryId } from "@/lib/types"

/**
 * Human-readable labels for spend categories (for strategy table, etc.).
 */
export const CATEGORY_LABELS: Record<SpendCategoryId, string> = {
  travel: "Travel",
  dining: "Dining",
  groceries: "Groceries",
  gas: "Gas",
  other: "Other",
}

/**
 * Card catalog: reward structure and metadata (updated from current issuer terms).
 * Multipliers = points/miles per $1 spent in that category (e.g. 3 = 3x).
 * Sources: Chase, Amex, United, Capital One (2024–2025).
 */
export const CARD_CATALOG: Card[] = [
  {
    id: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve",
    annualFee: 795,
    categoryMultipliers: {
      travel: 4,
      dining: 3,
      groceries: 1,
      gas: 1,
      other: 1,
    },
    benefits: ["$300 Travel Credit", "Priority Pass", "Chase Sapphire Lounge"],
    signUpBonus: 125000,
    applyUrl: "https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve",
  },
  {
    id: "amex-gold",
    name: "Amex Gold",
    annualFee: 325,
    categoryMultipliers: {
      travel: 1,
      dining: 4,
      groceries: 4,
      gas: 1,
      other: 1,
    },
    benefits: ["$120 Dining Credit", "$120 Uber Cash"],
    signUpBonus: 60000,
    applyUrl: "https://www.americanexpress.com/us/credit-cards/card/gold-card/",
  },
  {
    id: "united-explorer",
    name: "United Explorer Card",
    annualFee: 95,
    categoryMultipliers: {
      travel: 2,
      dining: 2,
      groceries: 1,
      gas: 1,
      other: 1,
    },
    benefits: ["Free Checked Bag", "Priority Boarding", "United Club passes"],
    signUpBonus: 60000,
    applyUrl: "https://www.united.com/en/us/fsr/credit-cards/explorer",
    brandIds: ["united"],
  },
  {
    id: "delta-skymiles-gold",
    name: "Delta SkyMiles® Gold American Express",
    annualFee: 150,
    categoryMultipliers: {
      travel: 2,
      dining: 1,
      groceries: 1,
      gas: 1,
      other: 1,
    },
    benefits: ["Free checked bag", "Priority boarding", "Main Cabin 1 boarding"],
    signUpBonus: 70000,
    applyUrl: "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-gold-american-express-card/",
    brandIds: ["delta"],
  },
  {
    id: "delta-skymiles-platinum",
    name: "Delta SkyMiles® Platinum American Express",
    annualFee: 350,
    categoryMultipliers: {
      travel: 3,
      dining: 1,
      groceries: 1,
      gas: 1,
      other: 1,
    },
    benefits: ["Delta Sky Club access", "Companion certificate", "Free checked bag"],
    signUpBonus: 90000,
    applyUrl: "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-platinum-american-express-card/",
    brandIds: ["delta"],
  },
  {
    id: "marriott-bonvoy-boundless",
    name: "Marriott Bonvoy Boundless®",
    annualFee: 95,
    categoryMultipliers: {
      travel: 6,
      dining: 3,
      groceries: 3,
      gas: 3,
      other: 2,
    },
    benefits: ["Free night award annually", "Silver Elite status", "15 Elite Night Credits"],
    signUpBonus: 50000,
    applyUrl: "https://creditcards.chase.com/travel-credit-cards/marriott-bonvoy/boundless",
    brandIds: ["marriott"],
  },
  {
    id: "marriott-bonvoy-bold",
    name: "Marriott Bonvoy Bold®",
    annualFee: 0,
    categoryMultipliers: {
      travel: 14,
      dining: 2,
      groceries: 2,
      gas: 1,
      other: 1,
    },
    benefits: ["No annual fee", "Silver Elite status", "5 Elite Night Credits"],
    applyUrl: "https://creditcards.chase.com/travel-credit-cards/marriott-bonvoy/bold",
    brandIds: ["marriott"],
  },
  {
    id: "hilton-honors-surpass",
    name: "Hilton Honors Surpass® Card",
    annualFee: 150,
    categoryMultipliers: {
      travel: 12,
      dining: 6,
      groceries: 6,
      gas: 6,
      other: 3,
    },
    benefits: ["Hilton Gold status", "Free night reward", "Priority Pass"],
    signUpBonus: 170000,
    applyUrl: "https://www.americanexpress.com/us/credit-cards/card/hilton-honors-surpass-american-express-card/",
    brandIds: ["hilton"],
  },
  {
    id: "american-aadvantage-mileup",
    name: "AAdvantage® MileUp®",
    annualFee: 0,
    categoryMultipliers: {
      travel: 2,
      dining: 2,
      groceries: 1,
      gas: 1,
      other: 1,
    },
    benefits: ["No annual fee", "2x at grocery stores", "25% off in-flight purchases"],
    signUpBonus: 15000,
    applyUrl: "https://www.citi.com/credit-cards/aadvantage-mileup",
    brandIds: ["american"],
  },
  {
    id: "american-aadvantage-exec",
    name: "Citi® / AAdvantage® Executive World Elite Mastercard®",
    annualFee: 595,
    categoryMultipliers: {
      travel: 2,
      dining: 1,
      groceries: 1,
      gas: 1,
      other: 1,
    },
    benefits: ["Admirals Club access", "Free checked bag", "Priority boarding"],
    signUpBonus: 70000,
    applyUrl: "https://www.citi.com/credit-cards/aadvantage-executive",
    brandIds: ["american"],
  },
  {
    id: "chase-freedom-unlimited",
    name: "Chase Freedom Unlimited",
    annualFee: 0,
    categoryMultipliers: {
      travel: 5,
      dining: 3,
      groceries: 1.5,
      gas: 1.5,
      other: 1.5,
    },
    benefits: ["No annual fee", "5% Chase Travel", "3% dining & drugstores"],
    applyUrl: "https://www.chase.com/personal/credit-cards/freedom/unlimited",
  },
  {
    id: "capital-one-venture",
    name: "Capital One Venture",
    annualFee: 95,
    categoryMultipliers: {
      travel: 5,
      dining: 2,
      groceries: 2,
      gas: 2,
      other: 2,
    },
    benefits: ["2x miles on everything", "Global Entry / TSA PreCheck credit"],
    signUpBonus: 75000,
    applyUrl: "https://www.capitalone.com/credit-cards/venture/",
  },
]

export function getCardById(id: string): Card | undefined {
  return CARD_CATALOG.find((c) => c.id === id)
}

export function getCardsByIds(ids: string[]): Card[] {
  return ids
    .map(getCardById)
    .filter((c): c is Card => c !== undefined)
}

/** Search catalog by name (case-insensitive, partial match). */
export function searchCards(query: string): Card[] {
  const q = query.trim().toLowerCase()
  if (!q) return CARD_CATALOG
  return CARD_CATALOG.filter((c) => c.name.toLowerCase().includes(q))
}

/** Get all cards in the catalog that are co-branded with the given brand id. */
export function getCardsForBrand(brandId: string): Card[] {
  return CARD_CATALOG.filter(
    (c) => c.brandIds && c.brandIds.includes(brandId)
  )
}
