# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VIX Impulse is a React-based dashboard for VIX (Volatility Index) analytics. It features interactive charts for VIX distribution analysis, SPX/VIX correlation, and futures term structure visualization with real-time data from Yahoo Finance API.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

### Tech Stack
- **React 19** with TypeScript
- **Vite** for build tooling
- **Recharts** for data visualization (BarChart, ScatterChart, AreaChart)
- **Tailwind CSS** (CDN) for styling
- **yahoo-finance2** for market data (via Vercel serverless functions)

### Project Structure

```
├── App.tsx                    # Main app with DataSourceProvider and navigation
├── types.ts                   # TypeScript enums and interfaces
├── api/                       # Vercel serverless functions
│   ├── vix.ts                 # VIX historical data endpoint
│   ├── spx.ts                 # S&P 500 data endpoint
│   └── futures.ts             # VIX futures term structure
├── services/                  # API client layer
│   ├── api.ts                 # Fetch wrapper with timeout
│   └── yahooFinance.ts        # Yahoo Finance API adapter
├── hooks/                     # React hooks for data fetching
│   ├── useVixHistory.ts       # VIX historical data
│   ├── useCorrelationData.ts  # Combined VIX/SPX correlation
│   └── useFuturesData.ts      # Futures term structure
├── context/
│   └── DataSourceContext.tsx  # Yahoo/CBOE source switching
├── components/
│   ├── DistributionView.tsx   # VIX histogram with API integration
│   ├── CorrelationView.tsx    # SPX/VIX scatter plot
│   ├── FuturesView.tsx        # Term structure area chart
│   ├── DataSourceSelector.tsx # Source toggle UI
│   ├── LoadingState.tsx       # Loading spinner
│   └── ErrorState.tsx         # Error display with retry
└── types/
    ├── market.ts              # Market data types (DailyVixData, etc.)
    └── api.ts                 # API response types
```

### Key Patterns

**Data Fetching**: Custom hooks (`useVixHistory`, `useCorrelationData`) fetch from `/api/*` endpoints. Components fallback to mock data on API failure.

**View Routing**: App.tsx uses a `currentView` state with the `View` enum. Add new views by:
1. Adding to `View` enum in `types.ts`
2. Adding nav item in `constants.ts`
3. Adding case in `renderContent()` switch

**API Layer**: Vercel serverless functions in `/api` proxy Yahoo Finance to avoid CORS. Data is cached for 5 minutes (`Cache-Control: s-maxage=300`).

**Styling Convention**: Dark theme with zinc-950 background, glassmorphism effects (backdrop-blur, semi-transparent borders), and monochrome glow effects.

### Deployment

Deploy to Vercel:
```bash
vercel
```

The `vercel.json` configures serverless functions and CORS headers. No environment variables required for Yahoo Finance (public data).

### Path Aliases

`@/*` maps to project root (configured in both `tsconfig.json` and `vite.config.ts`).
