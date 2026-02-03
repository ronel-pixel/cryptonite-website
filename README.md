# Cryptonite by Enclave

## Project Links:
- **Live Deployment (Vercel):** https://cryptonite-website-mo1f.vercel.app/
- **Source Code (GitHub):** https://github.com/ronel-pixel/cryptonite-website


**A crypto portfolio tracker with real-time data and AI-powered financial insights.**

Cryptonite delivers a premium experience for tracking cryptocurrencies: live market data, favorite coins, real-time reports with charts, and an AI recommendation engine that suggests Buy or No Buy based on current market metrics.

---

## Tech Stack

| Category        | Technologies                                      |
|----------------|----------------------------------------------------|
| **Core**       | React 19, Vite 7, TypeScript 5.9                   |
| **State**      | Redux Toolkit, React Redux                         |
| **UI & Motion**| Framer Motion, Lucide React, Recharts              |
| **Routing**    | React Router v7                                   |
| **API**        | Axios, OpenAI API (Chat Completions)              |
| **Data**       | CoinGecko API, CryptoCompare API                   |

---

## Key Features

### AI Financial Advisor

- **Real-time recommendations** based on live market data (price, volume, market cap, 24h/30d/60d/200d price changes).
- Choose one of your favorite coins and receive a concise **Buy** or **No Buy** recommendation with a short, data-driven explanation.
- Powered by OpenAI; model and API key are configured via environment variables.

### Luxury UI

- **Advanced parallax effects** in the hero section with layered imagery and smooth scroll-based motion.
- **3D depth and layering** via gradient aurora, decorative chart, and polished typography.
- Responsive layout with a **mobile-first nav** (hamburger menu, stacked links) and a clean fallback when parallax is simplified on small screens.
- Cohesive palette: Electric Blue, Teal, and dark gradients aligned with the brand.

### Resilience

- **Custom API interceptors** for CoinGecko and OpenAI to normalize errors and avoid leaking internals.
- **Rate-limit handling (429)** with a 10-second cooldown and user-friendly messages (“Data temporarily unavailable”).
- **Retry logic** with backoff for “More Info” requests so the app degrades gracefully under load instead of failing hard.

### Security

- **Environment variable protection**: API keys and config live only in `.env`, which is gitignored.
- **No hardcoded secrets**: OpenAI key is read via `import.meta.env` (Vite) and never logged.
- Secure, HTTPS-only communication with external APIs.

---

## Architecture

- **Organized CSS**: Global styles live in `src/index.css` with clear comment blocks per component (`/* Component: [Name] | Location: [Path] */`) for easier maintenance and theming.
- **Modular components**: Reusable pieces (Layout, Hero, CoinCard, Footer, FavoritesModal, ReportTerminal, LoadingSpinner, ErrorBoundary) keep the app maintainable and testable.
- **Structured state**: Redux slices for coins, favorites, and AI; hooks and services for API calls and env validation.
- **Error boundaries**: Top-level error boundary catches render errors and shows a fallback with Retry so the app never white-screens on unexpected failures.

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm).

### 1. Clone and install

```bash
git clone <repository-url>
cd crypto-track
npm install
```

### 2. Environment variables

Create a `.env` file in the **project root** (same folder as `package.json`):

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and set at least:

| Variable               | Description                                      |
|------------------------|--------------------------------------------------|
| `VITE_COINGECKO_API_URL` | CoinGecko API base URL (default is fine)      |
| `VITE_OPENAI_API_KEY`  | Your OpenAI API key (required for AI Recommendation) |
| `VITE_AI_MODEL`        | OpenAI model (e.g. `gpt-4`, `gpt-4o-mini`)      |

- **Never commit `.env`** — it is listed in `.gitignore`.
- Get an OpenAI API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### 3. Run locally

```bash
npm run dev
```

Then open the URL shown in the terminal (e.g. `http://localhost:5173`).

### Other commands

| Command           | Description                |
|-------------------|----------------------------|
| `npm run build`   | Production build           |
| `npm run preview` | Preview production build    |
| `npm run lint`    | Run ESLint                 |

---

## Project structure (overview)

```
src/
├── components/     # Layout, Hero, CoinCard, Footer, modals, etc.
├── config/         # Environment (env.ts)
├── hooks/          # Redux hooks
├── pages/          # Home, Reports, AI Recommendation, About
├── services/       # API client, AI service
├── store/          # Redux slices (coins, favorites, AI)
├── utils/          # Validation, formatting
├── index.css       # Global and component-scoped styles
└── main.tsx        # Entry, router, providers, error boundary
```

---

**Cryptonite** — *Crypto Portfolio with AI Insights* · by **Enclave**
