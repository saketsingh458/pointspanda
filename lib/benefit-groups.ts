/**
 * Keyword-based grouping of free-form benefit strings for the strategy page.
 * Uses case-insensitive substring matching; first match wins. Unmatched -> "Other".
 */
const BENEFIT_GROUP_KEYWORDS: Record<string, string[]> = {
  "Lounge Access": [
    "priority pass",
    "centurion",
    "sky club",
    "lounge",
    "plaza premium",
    "minute suites",
    "maple leaf",
  ],
  "TSA / Global Entry": ["global entry", "tsa precheck", "nexus", "clear"],
  "Travel Insurance": [
    "trip cancellation",
    "trip delay",
    "travel accident",
    "baggage delay",
    "evacuation",
    "emergency medical",
  ],
  "Auto Rental": ["auto rental", "cdw", "rental car"],
  "Purchase & Cell Protection": [
    "purchase protection",
    "extended warranty",
    "return protection",
    "cell phone",
  ],
  "Travel & Dining Credits": [
    "travel credit",
    "dining credit",
    "hotel credit",
    "uber",
    "lyft",
    "airline",
    "saks",
    "resy",
    "dell",
    "adobe",
    "indeed",
    "hilton",
    "wireless",
    "air ancillary",
    "air incidental",
  ],
  "Subscriptions & Lifestyle": [
    "walmart+",
    "uber one",
    "doordash",
    "peloton",
    "equinox",
    "disney",
    "streaming",
  ],
  "Elite Status": [
    "diamond",
    "gold",
    "platinum",
    "president",
    "executive",
    "preferred",
    "emerald",
  ],
}

const GROUP_ORDER = [
  "Lounge Access",
  "TSA / Global Entry",
  "Travel Insurance",
  "Auto Rental",
  "Purchase & Cell Protection",
  "Travel & Dining Credits",
  "Subscriptions & Lifestyle",
  "Elite Status",
  "Other",
] as const

function getGroupForBenefit(label: string): string {
  const lower = label.toLowerCase()
  for (const [groupName, keywords] of Object.entries(BENEFIT_GROUP_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return groupName
    }
  }
  return "Other"
}

/**
 * Group benefit labels by category. Returns a map of group name -> benefit strings.
 * Groups are ordered by GROUP_ORDER.
 */
export function groupBenefitsByCategory(
  labels: string[]
): Array<{ group: string; benefits: string[] }> {
  const byGroup = new Map<string, string[]>()
  for (const label of labels) {
    const group = getGroupForBenefit(label)
    const existing = byGroup.get(group)
    if (existing) {
      existing.push(label)
    } else {
      byGroup.set(group, [label])
    }
  }
  return GROUP_ORDER.filter((g) => byGroup.has(g)).map((group) => ({
    group,
    benefits: byGroup.get(group)!,
  }))
}
