#!/usr/bin/env node
/**
 * Consolidates CPP to a single "assumed" value and replaces 0 with 1.00.
 * - For each card: set cpp_assumed = current ranking CPP (avg of editorial when present, else cpp_assumed, else 1.25).
 * - If that value is 0, use 1.00.
 * - Replace any 0 in valuation fields (cpp_nerdwallet, cpp_pointsguy, cpp_bankrate, cpp_creditkarma, cpp_assumed) with 1.00.
 * Run: node scripts/consolidate-cpp-to-assumed.mjs
 */

import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const CARDS_PATH = join(ROOT, "data", "cards.json")

const EDITORIAL_KEYS = ["cpp_nerdwallet", "cpp_pointsguy", "cpp_bankrate", "cpp_creditkarma"]
const DEFAULT_CPP = 1.25

function computeCurrentRankingCpp(card) {
  const v = card.valuation || {}
  const editorial = EDITORIAL_KEYS.map((k) => v[k]).filter((n) => n != null && n > 0)
  if (editorial.length > 0) {
    const sum = editorial.reduce((a, b) => a + b, 0)
    return Math.round((sum / editorial.length) * 100) / 100
  }
  if (v.cpp_assumed != null) return v.cpp_assumed
  return DEFAULT_CPP
}

function normalizeZero(val) {
  return val === 0 ? 1.0 : val
}

function run() {
  const cards = JSON.parse(readFileSync(CARDS_PATH, "utf8"))
  let updated = 0
  const migrated = cards.map((card) => {
    const valuation = { ...(card.valuation || {}) }
    let rankingCpp = computeCurrentRankingCpp({ ...card, valuation })
    if (rankingCpp === 0) rankingCpp = 1.0
    valuation.cpp_assumed = rankingCpp
    for (const key of [...EDITORIAL_KEYS, "cpp_assumed"]) {
      if (valuation[key] === 0) valuation[key] = 1.0
    }
    const changed =
      JSON.stringify(valuation) !== JSON.stringify(card.valuation || {})
    if (changed) updated++
    return { ...card, valuation }
  })
  writeFileSync(CARDS_PATH, JSON.stringify(migrated, null, 2) + "\n", "utf8")
  console.log(`Consolidated CPP to assumed and normalized 0→1.00 for ${updated} cards.`)
}

run()
