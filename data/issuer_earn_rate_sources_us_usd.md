# Issuer-first earn rate capture (US/USD)

This note captures issuer-language checks used for travel portal vs direct airfare/hotel normalization updates in `data/cards.json`.

## Captured sources and extracted travel language

- `capital-one-quicksilver-cash-rewards`
  - Source: <https://www.capitalone.com/credit-cards/quicksilver/>
  - Captured: 5% on hotels and rental cars booked through Capital One Travel (portal-only channel)
- `venture-x-business`
  - Source: <https://www.capitalone.com/small-business/credit-cards/venture-x-business/>
  - Captured: 10x on hotels/rental cars and 5x on flights through Capital One Business Travel (portal channel)
- `capital-one-venture-x-rewards-credit-card`
  - Source: <https://www.capitalone.com/credit-cards/venture-x/>
  - Captured: portal-split rates (10x hotels/rental cars; 5x flights/vacation rentals)
- `capital-one-savor-cash-rewards`
  - Source: <https://www.capitalone.com/credit-cards/savor/>
  - Captured: travel bonus is through Capital One Travel (portal channel)
- `us-bank-altitude-reserve-visa-infinite`
  - Sources:
    - <https://www.usbank.com/credit-cards/altitude-reserve-visa-infinite-credit-card.html>
    - <https://rewards.usbank.com/benefits/card/AltitudeReserveBenefits/program-rules>
  - Captured: elevated hotel/car multiplier applies to prepaid portal bookings in Altitude Rewards Center; separate broader travel multiplier applies outside portal
- `wells-fargo-autograph-journey`
  - Sources:
    - <https://creditcards.wellsfargo.com/autograph-journey-visa-credit-card/>
    - <https://www.wellsfargo.com/credit-cards/autograph-journey-visa/terms/>
  - Captured: 5x hotels, 4x airlines, 3x other travel (airline/hotel direct channels + broader travel, not a single portal-only bucket)
- `citi-strata-premier-card`
  - Source: <https://www.citi.com/credit-cards/citi-strata-premier-credit-card>
  - Captured: 10x portal travel channel plus 3x airfare and 3x other hotel purchases (direct/broad travel split)
- `amex-business-platinum`
  - Sources:
    - <https://www.americanexpress.com/us/credit-cards/business/business-platinum-card/>
    - <https://www.americanexpress.com/en-us/travel/terms-and-conditions>
  - Captured: 5x applies to eligible flights and prepaid hotels via Amex Travel context; represented as split travel keys

## Scope note

The full 100-card issuer inventory and issuer URLs are documented in `data/issuer_source_checklist_us_usd.md`. This file records the specific issuer checks that drove travel-key normalization edits.

## Cap period verification (cap_amount backfill)

Issuer pages and product terms were used to classify cap periods for all capped earn keys. Where card `developer_notes` already quoted issuer term language (for example, "per month", "per billing cycle", "per quarter", "per year"), that language was used as the evidence source and cross-checked against issuer product pages.

### Verified and backfilled

- `gemini-credit-card` `gas_ev_transit` -> `cap_period: monthly` (`$300` per month)
- `chase-freedom-flex` `rotating_categories` -> `cap_period: quarterly` (5% categories on first `$1,500` each quarter)
- `ink-business-preferred-credit-card` `travel` -> `cap_period: annual` (3x on first `$150,000` combined spend per account anniversary year)
- `amex-gold-card` `dining` -> `cap_period: annual` (4x up to `$50,000` per year)
- `amex-gold-card` `groceries` -> `cap_period: annual` (4x up to `$25,000` per year)
- `american-express-business-gold-card` `top_two_categories` -> `cap_period: annual` (`$150,000` combined annual cap)
- `blue-cash-preferred-card-from-american-express` `us_supermarkets` -> `cap_period: annual` (`$6,000` per year)
- `blue-cash-everyday-card` `us_supermarkets` -> `cap_period: annual` (`$6,000` per year)
- `blue-cash-everyday-card` `us_online_retail` -> `cap_period: annual` (`$6,000` per year)
- `blue-cash-everyday-card` `us_gas_stations` -> `cap_period: annual` (`$6,000` per year)
- `amex-everyday-credit-card` `us_supermarkets` -> `cap_period: annual` (`$6,000` per year)
- `amex-everyday-preferred-credit-card` `us_supermarkets` -> `cap_period: annual` (`$6,000` per year)
- `blue-business-plus-credit-card` `all_purchases` -> `cap_period: annual` (`$50,000` per calendar year)
- `citi-custom-cash-card` `top_category` -> `cap_period: monthly` (first `$500` per billing cycle)
- `citi-rewards-plus` `gas_ev_transit` -> `cap_period: annual` (`$6,000` combined annual cap)
- `discover-it-cash-back` `rotating` -> `cap_period: quarterly` (first `$1,500` each quarter)
- `discover-it-chrome` `dining` -> `cap_period: quarterly` (2% categories first `$1,000` combined each quarter)
- `discover-it-student-cash-back` `rotating` -> `cap_period: quarterly` (first `$1,500` each quarter)
- `discover-it-secured` `dining` -> `cap_period: quarterly` (2% categories first `$1,000` combined each quarter)
- `pnc-cash-rewards-visa` `groceries` -> `cap_period: annual` (bonus tiers on first `$8,000` combined annually)

### Data quality corrections applied with issuer alignment

- `citi-rewards-plus` `gas_ev_transit`: `cap_amount` corrected `6` -> `6000`
- `discover-it-cash-back` `rotating`: `cap_amount` corrected `1` -> `1500`
- `discover-it-chrome` `dining`: `cap_amount` corrected `1` -> `1000`
- `discover-it-student-cash-back` `rotating`: `cap_amount` corrected `1` -> `1500`
- `discover-it-secured` `dining`: `cap_amount` corrected `1` -> `1000`
- `pnc-cash-rewards-visa` `groceries`: `cap_amount` corrected `8` -> `8000`

### Unresolved (left without cap_period by policy)

- `amex-centurion-card` `large_purchases` (`cap_amount: 1000000`): invitation-only program language is not explicit enough in accessible issuer materials to assert a formal earn-cap period, so `cap_period` remains unset.
