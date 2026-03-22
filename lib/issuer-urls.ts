import type { Card } from "@/lib/types"

/** Issuer name -> credit cards home page. Used when apply_url is invalid or 404. */
export const ISSUER_CARDS_HOME: Record<string, string> = {
  Chase: "https://creditcards.chase.com/",
  "American Express": "https://www.americanexpress.com/us/credit-cards/",
  "Capital One": "https://www.capitalone.com/credit-cards/",
  Citi: "https://www.citi.com/credit-cards/",
  "Wells Fargo": "https://www.wellsfargo.com/credit-cards/",
  "Bank of America": "https://www.bankofamerica.com/credit-cards/products/",
  "U.S. Bank": "https://www.usbank.com/credit-cards/",
  Discover: "https://www.discover.com/credit-cards/",
  Robinhood: "https://robinhood.com/creditcard",
  Gemini: "https://www.gemini.com/credit-card",
  WebBank: "https://www.gemini.com/credit-card",
  "Column N.A.": "https://www.biltrewards.com/card",
  "SoFi Bank, N.A.": "https://www.sofi.com/card/",
  Upgrade: "https://www.upgrade.com/credit-card/",
  "Synchrony Bank": "https://venmo.com/about/creditcard/",
  "Coastal Community Bank": "https://venmo.com/about/creditcard/",
  "X1 Inc.": "https://x1.co/",
  "PNC Bank": "https://www.pnc.com/en/personal-banking/banking/credit-cards.html",
  Truist: "https://www.truist.com/credit-cards/",
  "TD Bank": "https://www.td.com/us/en/personal-banking/credit-cards/",
  "Navy Federal Credit Union":
    "https://www.navyfederal.org/loans-cards/credit-cards.html",
  "PenFed Credit Union": "https://www.penfed.org/credit-cards/",
  "Alliant Credit Union": "https://www.alliantcreditunion.org/bank/",
  Barclays: "https://cards.barclaycardus.com/banking/cards/",
  "Fifth Third Bank":
    "https://www.53.com/content/fifth-third/en/personal-banking/bank/credit-cards.html",
  "Huntington Bank": "https://www.huntington.com/Personal/credit-card",
  "Regions Bank": "https://www.regions.com/personal-banking/credit-cards/",
  "Citizens Bank": "https://www.citizensbank.com/credit-cards/",
}

/** Matches valid http/https apply URLs. */
const IS_VALID_APPLY_URL = /^https?:\/\//i

/**
 * Returns a safe apply URL for the card. Uses applyUrl if valid; otherwise
 * falls back to issuer's credit cards home page.
 */
export function getApplyUrl(card: Card): string | undefined {
  const url = card.applyUrl?.trim()
  if (url && IS_VALID_APPLY_URL.test(url)) return url
  if (card.issuer) return ISSUER_CARDS_HOME[card.issuer]
  return undefined
}
