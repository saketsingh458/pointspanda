# High-Fee Credit Audit (2026-03-06)

## Scope
- Threshold: `annual_fee >= 95`
- Cards audited: `31`
- Verification method: issuer pages first; secondary trusted references used when issuer pages blocked automated retrieval.

## Inventory Snapshot
- Audited card ids:
  - `robinhood-platinum-card`, `chase-sapphire-reserve`, `chase-sapphire-preferred-card`, `sapphire-reserve-for-business`, `ink-business-preferred-credit-card`, `amex-platinum-card`, `amex-gold-card`, `capital-one-venture-x-rewards-credit-card`, `ink-business-premier-credit-card`, `american-express-business-gold-card`, `amex-green-card`, `blue-cash-preferred-card-from-american-express`, `amex-everyday-preferred-credit-card`, `amex-centurion-card`, `amex-business-platinum`, `capital-one-venture-rewards`, `venture-x-business`, `capital-one-spark-miles-for-business`, `capital-one-spark-cash-plus`, `citi-strata-elite-card`, `citi-strata-premier-card`, `wells-fargo-autograph-journey`, `wells-fargo-signia-card`, `bank-of-america-premium-rewards-elite`, `bank-of-america-premium-rewards`, `us-bank-altitude-reserve-visa-infinite`, `bilt-palladium-card`, `atmos-rewards-summit-visa-infinite`, `truist-enjoy-beyond`, `penfed-pathfinder-rewards`, `barclays-arrival-premier`

## High-Confidence Data Corrections Applied
- Added missing credit entries:
  - `robinhood-platinum-card`: `Global Entry/TSA PreCheck` (`every_4_years`)
  - `amex-platinum-card`: `Global Entry/TSA PreCheck` (`every_4_years`)
  - `sapphire-reserve-for-business`: `DoorDash`, `Lyft`, `Giftcards.com`, `Global Entry/TSA PreCheck/NEXUS`
  - `penfed-pathfinder-rewards`: `Global Entry or TSA PreCheck`
- Removed stale/non-statement-credit entries:
  - `blue-cash-preferred-card-from-american-express`: removed `Equinox+ Credit`
  - `atmos-rewards-summit-visa-infinite`: removed `Travel Delay` (benefit is protection/voucher behavior, not a standard statement credit line item)
- Corrected frequency conditionals and cadence modeling:
  - normalized all statement-credit frequencies to: `monthly`, `quarterly`, `yearly`, `semi_annual`, `one_time`, `every_4_years`, `every_5_years`
  - converted annual totals to per-window amounts where credits are explicitly split monthly/quarterly/semiannual (for example: `$120 monthly` modeled as `$10` + `monthly`)
  - added/kept `restrictions` text for non-rollover windows and booking/eligibility constraints

## Canonical Frequency Policy
- Canonical values:
  - `monthly`
  - `quarterly`
  - `yearly`
  - `semi_annual`
  - `one_time`
  - `per_instance`
  - `every_<n>_years` (for example `every_4_years`)

## Key Verification References
- Chase Sapphire Reserve credits: <https://thepointsguy.com/credit-cards/chase-sapphire-reserve-credits/>
- Chase Sapphire Reserve for Business credits: <https://thepointsguy.com/credit-cards/chase-sapphire-reserve-for-business-statement-credits/>
- Capital One Venture X: <https://www.capitalone.com/credit-cards/venture-x/>
- Capital One TSA/Global Entry terms: <https://www.capitalone.com/help-center/credit-cards/tsa-precheck-global-entry-benefits/>
- Citi Strata Elite benefits: <https://www.citi.com/credit-cards/credit-card-rewards/citi-strata-elite-benefits>
- Citi Strata Premier additional information: <https://www.citi.com/credit-cards/citi-strata-premier-credit-card/additional-information>
- Bank of America Premium Rewards Elite: <https://www.bankofamerica.com/credit-cards/products/premium-rewards-elite-credit-card/>
- Bank of America Premium Rewards: <https://www.bankofamerica.com/credit-cards/products/premium-rewards-credit-card/>
- U.S. Bank Altitude Reserve: <https://www.usbank.com/credit-cards/altitude-reserve-visa-infinite-credit-card.html>
- PenFed Pathfinder: <https://www.penfed.org/credit-cards/flag/pathfinder-rewards>
- Truist Enjoy Beyond: <https://www.truist.com/credit-cards/enjoy-beyond>
- Atmos Summit launch context: <https://newsroom.bankofamerica.com/content/newsroom/press-releases/2025/08/alaska-airlines-and-bank-of-america-present-a-new-premium-credit.html>

## Notes
- Some issuer pages were bot-protected during automated verification. Where direct scraping failed, high-confidence updates were limited to corroborated issuer-adjacent or established industry references.
