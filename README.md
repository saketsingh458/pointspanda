# Points Panda

Discover the perfect mix of credit cards for your spending habits. Points Panda walks you through three steps — estimate your monthly spending, add your current cards, and receive a personalized strategy that maximizes your annual points, miles, and cashback.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all Vitest tests |
| `npm run test:strategy` | Run strategy engine tests only |
| `npm run validate:cards` | Validate `data/cards.json` structure |

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
- **Testing** — [Vitest](https://vitest.dev/)
- **Icons** — [Lucide](https://lucide.dev/)

## Project Structure

```
app/            Pages (/, /intake, /wallet, /strategy)
components/     React components and shadcn/ui primitives
contexts/       PointPath context (spending, wallet, compare state)
data/           Card catalog (cards.json) and JSON schema
lib/            Strategy engine, card utilities, types
scripts/        Data pipeline and validation scripts
```
