/**
 * Brands users can select for "Specific Brand Spend".
 * Used by intake brand selector and to show brand-associated cards from the catalog.
 */

export const BRANDS = [
  { id: "amazon", name: "Amazon" },
  { id: "walmart", name: "Walmart" },
  { id: "target", name: "Target" },
  { id: "costco", name: "Costco" },
  { id: "starbucks", name: "Starbucks" },
  { id: "delta", name: "Delta Airlines" },
  { id: "united", name: "United" },
  { id: "american", name: "American Airlines" },
  { id: "marriott", name: "Marriott" },
  { id: "hilton", name: "Hilton" },
] as const

export type BrandId = (typeof BRANDS)[number]["id"]

export function getBrandById(id: string): (typeof BRANDS)[number] | undefined {
  return BRANDS.find((b) => b.id === id)
}
