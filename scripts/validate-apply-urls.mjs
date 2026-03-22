#!/usr/bin/env node
/**
 * Validates apply_url in data/cards.json. Replaces 404s and invalid URLs
 * with issuer credit cards home page.
 * Run: node scripts/validate-apply-urls.mjs
 */

import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const CARDS_PATH = join(ROOT, "data", "cards.json")

const IS_VALID_APPLY_URL = /^https?:\/\//i

const ISSUER_CARDS_HOME = {
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "PointsPandaAI/1.0 (apply-url-validator)" },
    })
    return { ok: res.ok, status: res.status }
  } catch (e) {
    return { ok: false, status: null, error: e.message }
  }
}

function getIssuerHome(issuer) {
  return issuer ? ISSUER_CARDS_HOME[issuer] : undefined
}

async function main() {
  let cards
  try {
    cards = JSON.parse(readFileSync(CARDS_PATH, "utf8"))
  } catch (e) {
    console.error("Failed to read data/cards.json:", e.message)
    process.exit(1)
  }

  if (!Array.isArray(cards)) {
    console.error("data/cards.json must be a JSON array.")
    process.exit(1)
  }

  const changes = []
  let modified = false

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    const applyUrl = card?.ui_elements?.apply_url
    const issuer = card?.issuer
    const id = card?.id ?? `card-${i}`

    if (!applyUrl) continue

    const trimmed = String(applyUrl).trim()

    if (!IS_VALID_APPLY_URL.test(trimmed)) {
      const home = getIssuerHome(issuer)
      if (home) {
        if (card.ui_elements) card.ui_elements.apply_url = home
        changes.push({ id, reason: "invalid URL", old: trimmed, new: home })
        modified = true
      } else {
        changes.push({ id, reason: "invalid URL, no issuer home", old: trimmed })
      }
      continue
    }

    const { ok, status, error } = await checkUrl(trimmed)
    await sleep(500)

    if (!ok) {
      const home = getIssuerHome(issuer)
      if (home) {
        if (card.ui_elements) card.ui_elements.apply_url = home
        changes.push({
          id,
          reason: error ? `fetch error: ${error}` : `HTTP ${status}`,
          old: trimmed,
          new: home,
        })
        modified = true
      } else {
        changes.push({
          id,
          reason: error ? `fetch error: ${error}` : `HTTP ${status}`,
          old: trimmed,
          note: "no issuer home mapping",
        })
      }
    }
  }

  if (changes.length > 0) {
    console.log("Apply URL validation results:")
    for (const c of changes) {
      const msg = c.new
        ? `  ${c.id}: ${c.reason} -> ${c.new}`
        : `  ${c.id}: ${c.reason} (${c.note ?? "not updated"})`
      console.log(msg)
    }
  }

  if (modified) {
    writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 2) + "\n", "utf8")
    console.log("\nUpdated data/cards.json")
  } else if (changes.length === 0) {
    console.log("All apply URLs are valid. No changes made.")
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
