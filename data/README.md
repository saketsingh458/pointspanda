# Card catalog data

This folder is the **single source of truth** for the US credit card catalog used by PointsPandaAI.

## Files

- **`cards.json`** — Array of card objects in snake_case schema. Each card must have exactly one of:
  - `multipliers` (earn structure card), or
  - `ui_elements.benefits_list` (benefit-only card).
  The app loads this via `lib/cards.ts`.
- **`cards.schema.json`** — JSON Schema for `cards.json`. Use it to validate the catalog after edits.

## How to update the catalog

1. **Edit `cards.json`**  
   Update the card(s) you need: benefits, annual fee, earn structure (category multipliers), points value (base/max cpp), sign-up bonus, apply URL, etc. Add or remove cards as needed.
   For transferable-points cards, include `transfer_partners` entries in the format:
   ```json
   "transfer_partners": [
     { "name": "Air Canada Aeroplan", "ratio": "1:1" },
     { "name": "World of Hyatt", "ratio": "1:1" }
   ]
   ```

2. **Update metadata**  
   Set `lastUpdatedAt` to the current ISO date (e.g. `2025-01-01T00:00:00Z`) and ensure `sourceUrl` points to the issuer or reference page.

3. **Card art**  
   Set `imageUrl` to a public image URL (e.g. issuer CDN) or a local path like `/cards/<card-id>.webp`. See [How to get card images](#how-to-get-card-images) below.

4. **Validate**  
   Run the validation script before committing:
   ```bash
   npm run validate:cards
   ```
   This checks `data/cards.json` structure plus travel-key semantics.

5. **Deploy**  
   The app reads the catalog at build time; deploy as usual to ship updates.

**Source:** The catalog is maintained from [The Points Guy – Best Credit Cards](https://thepointsguy.com/cards/). Update `cards.json` manually when TPG’s list or card details change.

## Update checklist (per card)

- [ ] Benefits (full list)
- [ ] Annual fee
- [ ] Category multipliers (travel, dining, groceries, gas, other)
- [ ] Points value base and max (cents per point), and note
- [ ] Sign-up bonus (if any)
- [ ] Transfer partners + ratios (for transferable-points ecosystems)
- [ ] `applyUrl` and `sourceUrl`
- [ ] `lastUpdatedAt` (ISO date)
- [ ] `imageUrl` (public URL or path under `/cards/...`)

## Transfer partner capture policy

- Add `transfer_partners` only for transferable ecosystems (for example: Chase UR, Amex Membership Rewards, Capital One Miles, Citi ThankYou, Wells Fargo Rewards transfer-enabled cards, and Bilt Rewards).
- Keep partner names and ratios exactly as published by issuer/official program pages where available.
- If an official source is not directly machine-readable, use current authoritative secondary coverage and revisit quarterly.
- Ratios are stored as strings (for example `1:1`, `5:3`, `2:1.5`) so non-integer conversions are preserved.

## Canonical travel keys

Use only these travel keys under `multipliers.categories`:

- `travel_portal`
- `travel_portal_hotels_cars`
- `travel_portal_flights`
- `flights_direct`
- `hotels_direct`
- `flights_direct_or_portal`
- `hotels_prepaid_portal`
- `travel`

Portal-only keys must include `requires_portal: true`:

- `travel_portal`
- `travel_portal_hotels_cars`
- `travel_portal_flights`
- `hotels_prepaid_portal`

Avoid deprecated aliases like `travel_general`, `flights_hotels_direct`, `flights`, `hotels_prepaid`, and `rental_cars`. `npm run validate:cards` will fail if these are present.

## How to get card images

`imageUrl` in each card can be:

- **Public URL** — Use a direct image URL from the issuer (e.g. Chase or Capital One card-art CDNs). The app allows `creditcards.chase.com` and `ecm.capitalone.com` in `next.config.ts`; add other domains there if you use more external image URLs.
- **Local path** — Use `/cards/<card-id>.<ext>` and place the file in `public/cards/` (e.g. `public/cards/chase-sapphire-reserve.webp`). The `<card-id>` is the card’s `id` in `cards.json`.

To find public image URLs: open the card’s product page on the issuer site or [The Points Guy](https://thepointsguy.com/cards/), then right‑click the card image → “Copy image address” and paste into `imageUrl`. If an image fails to load, the app falls back to the gradient placeholder (see `components/wallet-card-item.tsx`).

## Quarterly review

Schedule a quarterly pass to refresh key cards from issuer or reference sites so the catalog stays accurate.
