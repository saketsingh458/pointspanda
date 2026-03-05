export interface TravelSubtypeMix {
  flight: number
  hotel: number
  car: number
  general: number
}

export interface ChannelShareBySubtype {
  flight: { portal: number; direct: number }
  hotel: { portal: number; direct: number }
  car: { portal: number; direct: number }
  general: { portal: number; direct: number }
}

/**
 * Benchmarks are derived from public travel-industry snapshots:
 * - OTA share of US gross bookings (~21% in 2023-2024, Phocuswright public summaries)
 * - OTA share of online travel (~50%, Phocuswright public summaries)
 * - Hotels are OTA-heavy vs flights (distribution reports + issuer portal behavior)
 */
export const DEFAULT_TRAVEL_SUBTYPE_MIX: TravelSubtypeMix = {
  hotel: 0.4,
  flight: 0.35,
  car: 0.1,
  general: 0.15,
}

export const DEFAULT_CHANNEL_SHARE_BY_SUBTYPE: ChannelShareBySubtype = {
  flight: { portal: 0.5, direct: 0.5 },
  hotel: { portal: 0.5, direct: 0.5 },
  car: { portal: 0.5, direct: 0.5 },
  general: { portal: 0.5, direct: 0.5 },
}

export const DEFAULT_CAP_PERIOD_ASSUMPTION = "inferred_from_amount"

export const BENCHMARK_SOURCES = [
  "Phocuswright US OTA market updates (OTA share and online mix, 2024-2025 public summaries)",
  "Deloitte 2024 US summer travel trend reporting (lodging vs air spend context)",
  "SiteMinder 2024 hotel distribution trends (direct vs OTA behavior)",
] as const
