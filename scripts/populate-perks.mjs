#!/usr/bin/env node
/**
 * Populates data/cards.json with perks_and_protections and higher_tier_benefits.
 * Run: node scripts/populate-perks.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CARDS_PATH = join(ROOT, "data", "cards.json");

const EMPTY = {
  perks_and_protections: {
    lounge_access: [],
    elite_status: [],
    travel_insurances: [],
    consumer_protections: [],
  },
  higher_tier_benefits: [],
};

// Visa Infinite standard protections (rental CDW, trip cancellation, etc.)
const VISA_INFINITE_PROTECTIONS = {
  lounge_access: [],
  elite_status: [],
  travel_insurances: [
    "Secondary Auto Rental CDW",
    "Trip Cancellation/Interruption",
    "Baggage Delay/Loss",
    "Travel Accident Insurance",
  ],
  consumer_protections: ["Extended Warranty", "Purchase Protection"],
};

// Visa Signature standard protections (slightly less than Infinite)
const VISA_SIGNATURE_PROTECTIONS = {
  lounge_access: [],
  elite_status: [],
  travel_insurances: [
    "Secondary Auto Rental CDW",
    "Trip Cancellation/Interruption",
    "Baggage Delay/Loss",
    "Travel Accident Insurance",
  ],
  consumer_protections: ["Extended Warranty", "Purchase Protection"],
};

// Mastercard World Elite standard protections
const MC_WORLD_ELITE_PROTECTIONS = {
  lounge_access: [],
  elite_status: [],
  travel_insurances: [
    "Auto Rental CDW",
    "Trip Cancellation/Interruption",
    "Baggage Delay/Loss",
    "Travel Accident Insurance",
  ],
  consumer_protections: ["Extended Warranty", "Purchase Protection"],
};

const PERKS_BY_CARD_ID = {
  "robinhood-gold-card": EMPTY,
  "robinhood-platinum-card": {
    perks_and_protections: {
      lounge_access: ["Priority Pass Select (unlimited visits, 2 guests)"],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Extended Warranty", "Purchase Protection"],
    },
    higher_tier_benefits: [],
  },
  "gemini-credit-card": MC_WORLD_ELITE_PROTECTIONS,
  "chase-sapphire-reserve": {
    perks_and_protections: {
      lounge_access: [
        "Priority Pass Select (unlimited visits, 2 free guests)",
        "Chase Sapphire Lounges (JFK, LGA, BOS, PHL, PHX, SAN, HKG)",
        "Air Canada Maple Leaf Lounges (when flying Air Canada)",
      ],
      elite_status: [
        "National Emerald Club Executive",
        "Avis Preferred",
        "Silvercar status",
      ],
      travel_insurances: [
        "Primary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay Reimbursement",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
        "Emergency Evacuation",
      ],
      consumer_protections: [
        "Purchase Protection",
        "Extended Warranty",
        "Return Protection",
      ],
    },
    higher_tier_benefits: [],
  },
  "chase-sapphire-preferred-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay Reimbursement",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "chase-freedom-unlimited": VISA_SIGNATURE_PROTECTIONS,
  "chase-freedom-flex": VISA_SIGNATURE_PROTECTIONS,
  "sapphire-reserve-for-business": {
    perks_and_protections: {
      lounge_access: [
        "Priority Pass Select (unlimited visits, 2 free guests)",
        "Chase Sapphire Lounges",
        "Air Canada Maple Leaf Lounges (when flying Air Canada)",
      ],
      elite_status: [
        "National Emerald Club Executive",
        "Avis Preferred",
        "IHG One Rewards Diamond Elite (with $120k spend)",
        "Southwest A-List (with $120k spend)",
      ],
      travel_insurances: [
        "Primary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay Reimbursement",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [
      {
        benefit_name: "IHG One Rewards Diamond Elite Status",
        description: "Complimentary Diamond Elite status at IHG hotels",
        unlock_requirement: "$120,000 annual spend",
      },
      {
        benefit_name: "Southwest A-List Status",
        description: "A-List priority boarding and bonus Rapid Rewards points",
        unlock_requirement: "$120,000 annual spend",
      },
    ],
  },
  "ink-business-preferred-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "amex-platinum-card": {
    perks_and_protections: {
      lounge_access: [
        "Centurion Lounges (unlimited; guests $50/ea or free with $75k spend)",
        "Delta Sky Club (when flying Delta, limited visits)",
        "Priority Pass Escape lounges (when Centurion/Delta not available)",
        "Plaza Premium lounges",
      ],
      elite_status: [
        "Hilton Honors Gold",
        "Marriott Bonvoy Gold",
        "National Emerald Club Executive",
        "Hertz President's Circle",
        "Avis Preferred Plus",
      ],
      travel_insurances: [
        "Primary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
        "Emergency Medical Evacuation",
      ],
      consumer_protections: [
        "Purchase Protection",
        "Extended Warranty",
        "Cell Phone Protection",
      ],
    },
    higher_tier_benefits: [
      {
        benefit_name: "Centurion Lounge Complimentary Guest Access",
        description: "Up to 2 free guests per visit at Centurion Lounges",
        unlock_requirement: "$75,000 eligible spend in a calendar year",
      },
    ],
  },
  "amex-gold-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: ["Hilton Honors (5x points when Hilton selected as transfer partner)"],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "capital-one-venture-x-rewards-credit-card": {
    perks_and_protections: {
      lounge_access: [
        "Capital One Lounges (primary cardmember; guest access spend-gated as of Feb 2026)",
        "Capital One Landings (primary cardmember)",
        "Priority Pass Select (unlimited; guest access spend-gated as of Feb 2026)",
        "Plaza Premium lounges",
      ],
      elite_status: ["Hertz President's Circle"],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [
      {
        benefit_name: "Priority Pass Complimentary Guest Access",
        description: "Free guest access to Priority Pass lounges; without spend, guests pay $35 each (effective Feb 2026)",
        unlock_requirement: "$75,000 spend in a calendar year",
      },
      {
        benefit_name: "Capital One Lounge Guest Access",
        description: "2 complimentary guests at Capital One Lounges, 1 at Landings",
        unlock_requirement: "$75,000 spend in a calendar year",
      },
    ],
  },
  "chase-freedom-rise": VISA_SIGNATURE_PROTECTIONS,
  "chase-slate-edge": VISA_SIGNATURE_PROTECTIONS,
  "ink-business-unlimited-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "ink-business-cash": VISA_SIGNATURE_PROTECTIONS,
  "ink-business-premier-credit-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "american-express-business-gold-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "amex-green-card": {
    perks_and_protections: {
      lounge_access: ["LoungeBuddy credits (enrollment required)"],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "blue-cash-preferred-card-from-american-express": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "blue-cash-everyday-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "amex-centurion-card": {
    perks_and_protections: {
      lounge_access: [
        "Centurion Lounges (unlimited, complimentary guests)",
        "Delta Sky Club (unlimited when flying Delta)",
        "Priority Pass (unlimited)",
        "International American Express lounges",
      ],
      elite_status: [
        "Hilton Honors Diamond",
        "Marriott Bonvoy Gold",
        "National Emerald Club Executive",
        "Hertz President's Circle",
        "Avis President's Club",
      ],
      travel_insurances: [
        "Primary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
        "Emergency Medical Evacuation",
      ],
      consumer_protections: [
        "Purchase Protection",
        "Extended Warranty",
        "Cell Phone Protection",
      ],
    },
    higher_tier_benefits: [],
  },
  "amex-business-platinum": {
    perks_and_protections: {
      lounge_access: [
        "Centurion Lounges (unlimited; guests $50/ea or free with $75k spend)",
        "Delta Sky Club (when flying Delta)",
        "Priority Pass Select",
        "Lufthansa Business Lounges (when flying Lufthansa Group)",
      ],
      elite_status: [
        "Hilton Honors Gold",
        "Marriott Bonvoy Gold",
        "National Emerald Club Executive",
        "Hertz President's Circle",
        "Avis Preferred Plus",
      ],
      travel_insurances: [
        "Primary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [
      {
        benefit_name: "Centurion Lounge Complimentary Guest Access",
        description: "Up to 2 free guests per visit at Centurion Lounges",
        unlock_requirement: "$75,000 eligible spend in a calendar year",
      },
    ],
  },
  "blue-business-plus-credit-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "capital-one-venture-rewards": VISA_INFINITE_PROTECTIONS,
  "blue-business-cash-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "capital-one-ventureone-rewards-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "capital-one-savorone-cash-rewards": MC_WORLD_ELITE_PROTECTIONS,
  "capital-one-savor-student-cash-rewards": MC_WORLD_ELITE_PROTECTIONS,
  "capital-one-quicksilver-cash-rewards": MC_WORLD_ELITE_PROTECTIONS,
  "capital-one-quicksilverone-cash-rewards": MC_WORLD_ELITE_PROTECTIONS,
  "capital-one-quicksilver-secured-cash-rewards": MC_WORLD_ELITE_PROTECTIONS,
  "capital-one-platinum-credit-card": MC_WORLD_ELITE_PROTECTIONS,
  "capital-one-platinum-secured": MC_WORLD_ELITE_PROTECTIONS,
  "venture-x-business": {
    perks_and_protections: {
      lounge_access: [
        "Capital One Lounges (2 complimentary guests)",
        "Capital One Landings",
        "Priority Pass Select (2 complimentary guests)",
        "Plaza Premium lounges",
      ],
      elite_status: ["Hertz President's Circle"],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "capital-one-spark-miles-for-business": MC_WORLD_ELITE_PROTECTIONS,
  "capital-one-spark-cash-plus": MC_WORLD_ELITE_PROTECTIONS,
  "citi-strata-elite-card": {
    perks_and_protections: {
      lounge_access: [
        "Priority Pass Select (unlimited visits)",
        "Citi lounge access",
      ],
      elite_status: [
        "Hilton Honors Gold",
        "National Emerald Club Executive",
        "Avis Preferred",
      ],
      travel_insurances: [
        "Primary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: [
        "Purchase Protection",
        "Extended Warranty",
        "Cell Phone Protection",
        "Citi Price Rewind",
      ],
    },
    higher_tier_benefits: [],
  },
  "citi-strata-premier-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "citi-double-cash-card": MC_WORLD_ELITE_PROTECTIONS,
  "citi-custom-cash-card": MC_WORLD_ELITE_PROTECTIONS,
  "citi-simplicity-card": MC_WORLD_ELITE_PROTECTIONS,
  "citi-diamond-preferred-card": MC_WORLD_ELITE_PROTECTIONS,
  "citi-secured-mastercard": MC_WORLD_ELITE_PROTECTIONS,
  "wells-fargo-autograph-journey": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty", "Cell Phone Protection"],
    },
    higher_tier_benefits: [],
  },
  "wells-fargo-autograph-card": VISA_SIGNATURE_PROTECTIONS,
  "wells-fargo-active-cash": VISA_SIGNATURE_PROTECTIONS,
  "wells-fargo-reflect-card": VISA_SIGNATURE_PROTECTIONS,
  "wells-fargo-attune-card": VISA_SIGNATURE_PROTECTIONS,
  "wells-fargo-signia-card": {
    perks_and_protections: {
      lounge_access: [
        "Priority Pass Select (unlimited visits)",
        "Wells Fargo Lounge by Minute Suites",
      ],
      elite_status: [
        "Hilton Honors Gold",
        "National Emerald Club Executive",
        "Avis Preferred",
      ],
      travel_insurances: [
        "Primary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: [
        "Purchase Protection",
        "Extended Warranty",
        "Cell Phone Protection",
        "Return Protection",
      ],
    },
    higher_tier_benefits: [],
  },
  "bank-of-america-premium-rewards-elite": {
    perks_and_protections: {
      lounge_access: [
        "Priority Pass Select (unlimited visits)",
        "BoA Airport Lounges",
      ],
      elite_status: [
        "National Emerald Club Executive",
        "Avis Preferred",
      ],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty", "Return Protection"],
    },
    higher_tier_benefits: [
      {
        benefit_name: "Enhanced Premium Rewards Earnings",
        description: "25-75% rewards bonus based on Preferred Rewards tier",
        unlock_requirement: "Requires Preferred Rewards program tier (Platinum, Platinum Honors, or Diamond)",
      },
    ],
  },
  "bank-of-america-premium-rewards": VISA_SIGNATURE_PROTECTIONS,
  "bank-of-america-customized-cash-rewards": VISA_SIGNATURE_PROTECTIONS,
  "bank-of-america-unlimited-cash-rewards": VISA_SIGNATURE_PROTECTIONS,
  "bank-of-america-travel-rewards": VISA_SIGNATURE_PROTECTIONS,
  "bank-of-america-bankamericard": VISA_SIGNATURE_PROTECTIONS,
  "us-bank-altitude-connect-visa-signature": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty", "Cell Phone Protection"],
    },
    higher_tier_benefits: [],
  },
  "us-bank-altitude-go-visa-signature": VISA_SIGNATURE_PROTECTIONS,
  "us-bank-cash-plus-visa-signature": VISA_SIGNATURE_PROTECTIONS,
  "us-bank-smartly-visa-signature": VISA_SIGNATURE_PROTECTIONS,
  "us-bank-shield-visa-card": VISA_SIGNATURE_PROTECTIONS,
  "discover-it-cash-back": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [],
      consumer_protections: [],
    },
    higher_tier_benefits: [],
  },
  "discover-it-miles": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [],
      consumer_protections: [],
    },
    higher_tier_benefits: [],
  },
  "discover-it-chrome": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [],
      consumer_protections: [],
    },
    higher_tier_benefits: [],
  },
  "discover-it-student-cash-back": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [],
      consumer_protections: [],
    },
    higher_tier_benefits: [],
  },
  "discover-it-secured": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [],
      consumer_protections: [],
    },
    higher_tier_benefits: [],
  },
  "apple-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [],
      consumer_protections: [],
    },
    higher_tier_benefits: [],
  },
  "bilt-blue-card": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "bilt-palladium-card": {
    perks_and_protections: {
      lounge_access: [
        "Priority Pass Select (unlimited visits)",
        "Mastercard World Elite lounge access",
      ],
      elite_status: [],
      travel_insurances: [
        "Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "atmos-rewards-summit-visa-infinite": {
    perks_and_protections: {
      lounge_access: [
        "Priority Pass Select (unlimited visits)",
        "BoA Airport Lounges",
      ],
      elite_status: [
        "National Emerald Club Executive",
        "Avis Preferred",
      ],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Trip Delay",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [
      {
        benefit_name: "Global Companion Award",
        description: "25,000-point Global Companion Award and 10,000 status points boost",
        unlock_requirement: "Annual account renewal",
      },
    ],
  },
  "sofi-unlimited-2-percent-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "upgrade-cash-rewards-visa": VISA_SIGNATURE_PROTECTIONS,
  "venmo-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "x1-card": MC_WORLD_ELITE_PROTECTIONS,
  "x1-plus-card": MC_WORLD_ELITE_PROTECTIONS,
  "pnc-cash-unlimited-visa-signature": VISA_SIGNATURE_PROTECTIONS,
  "pnc-cash-rewards-visa": VISA_SIGNATURE_PROTECTIONS,
  "pnc-points-visa": VISA_SIGNATURE_PROTECTIONS,
  "truist-enjoy-travel": VISA_SIGNATURE_PROTECTIONS,
  "truist-enjoy-cash": VISA_SIGNATURE_PROTECTIONS,
  "truist-enjoy-beyond": {
    perks_and_protections: {
      lounge_access: ["Priority Pass Select (4 complimentary visits per year)"],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "td-first-class-visa-signature": VISA_SIGNATURE_PROTECTIONS,
  "td-double-up-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "td-cash-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "navy-federal-flagship-rewards": {
    perks_and_protections: {
      lounge_access: ["Priority Pass Select (unlimited visits)"],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "navy-federal-cashrewards": VISA_SIGNATURE_PROTECTIONS,
  "penfed-pathfinder-rewards": {
    perks_and_protections: {
      lounge_access: ["Priority Pass Membership"],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "penfed-power-cash-rewards": {
    perks_and_protections: {
      lounge_access: [],
      elite_status: [],
      travel_insurances: [],
      consumer_protections: [],
    },
    higher_tier_benefits: [],
  },
  "alliant-cashback-visa-signature-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "barclays-view-mastercard": MC_WORLD_ELITE_PROTECTIONS,
  "fifth-third-preferred-cash-back": VISA_SIGNATURE_PROTECTIONS,
  "huntington-voice-credit-card": VISA_SIGNATURE_PROTECTIONS,
  "regions-prestige-visa": {
    perks_and_protections: {
      lounge_access: ["Priority Pass Select (unlimited visits)"],
      elite_status: [],
      travel_insurances: [
        "Secondary Auto Rental CDW",
        "Trip Cancellation/Interruption",
        "Baggage Delay/Loss",
        "Travel Accident Insurance",
      ],
      consumer_protections: ["Purchase Protection", "Extended Warranty"],
    },
    higher_tier_benefits: [],
  },
  "citizens-bank-cash-back-plus": MC_WORLD_ELITE_PROTECTIONS,
};

function getPerksForCard(card) {
  const data = PERKS_BY_CARD_ID[card.id];
  if (data) return data;
  // Fallback by network
  if (card.network === "Visa") return VISA_SIGNATURE_PROTECTIONS;
  if (card.network === "Mastercard") return MC_WORLD_ELITE_PROTECTIONS;
  return EMPTY;
}

function insertPerks(card) {
  const perks = getPerksForCard(card);
  const { perks_and_protections, higher_tier_benefits } = perks;
  const keys = Object.keys(card);
  const insertIdx = keys.indexOf("multipliers") + 1;
  const beforeKeys = keys.slice(0, insertIdx);
  const afterKeys = keys.slice(insertIdx);
  const newCard = {};
  for (const k of beforeKeys) newCard[k] = card[k];
  newCard.perks_and_protections = perks_and_protections;
  newCard.higher_tier_benefits = higher_tier_benefits;
  for (const k of afterKeys) newCard[k] = card[k];
  return newCard;
}

function main() {
  const cards = JSON.parse(readFileSync(CARDS_PATH, "utf8"));
  if (!Array.isArray(cards)) {
    console.error("cards.json must be an array");
    process.exit(1);
  }
  const updated = cards.map(insertPerks);
  writeFileSync(CARDS_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log(`Updated ${updated.length} cards with perks_and_protections and higher_tier_benefits.`);
}

main();
