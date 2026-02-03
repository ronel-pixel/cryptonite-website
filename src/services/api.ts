import axios from 'axios';
import { getCoinGeckoApiUrl } from '../config/env';

export const api = axios.create({
  baseURL: getCoinGeckoApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Log failed requests (URL + status) for debugging. Then normalize errors only for "More Info".
 * Initial fetch (/coins/markets) is never blocked; "More Info" uses /simple/price with vs_currencies=usd,eur,ils.
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err)) {
      const fullUrl =
        err.config?.baseURL && err.config?.url
          ? `${err.config.baseURL}${err.config.url}`
          : err.config?.url ?? 'unknown';
      const status = err.response?.status;
      console.error(
        '[API] Request failed:',
        { url: fullUrl, status, message: err.message }
      );

      const url = err.config?.url ?? '';
      const params = err.config?.params ?? {};
      const isMoreInfoRequest =
        url.includes('/simple/price') &&
        String(params.vs_currencies) === 'usd,eur,ils';
      if (!isMoreInfoRequest) return Promise.reject(err);

      const message = err.message ?? 'Request failed';
      if (status === 429) {
        err.message =
          'Data temporarily unavailable due to high demand. Please try again in a minute.';
      } else if (message === 'Network Error' || err.code === 'ERR_NETWORK') {
        err.message =
          'Network error. Check your connection or try again later.';
      }
    }
    return Promise.reject(err);
  }
);

/** Cache TTL for "More Info" coin details: 2 minutes */
const COIN_CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Cached coin detail data for "More Info" (coinId -> { data, fetchedAt }).
 * Cleared on every hard refresh (F5) because the module re-initializes.
 */
const coinCache: Record<
  string,
  { data: { usd: number; eur: number; ils: number }; fetchedAt: number }
> = {};

/** Minimum interval between "More Info" requests (2s to avoid CoinGecko free-tier block). */
const MORE_INFO_MIN_INTERVAL_MS = 2000;
/** Last time a More Info request was sent (for throttling). */
let lastMoreInfoRequestTime = 0;

/** Global lock: when true, block new More Info requests for 10s after a 429. */
let isApiLocked = false;
let lockEndTime = 0;
const LOCK_DURATION_MS = 10 * 1000;
const RETRY_WAIT_MS = 3000;

const lockListeners: Array<() => void> = [];
let lockTimeoutId: ReturnType<typeof setTimeout> | null = null;

function setApiLocked() {
  isApiLocked = true;
  lockEndTime = Date.now() + LOCK_DURATION_MS;
  if (lockTimeoutId) clearTimeout(lockTimeoutId);
  lockTimeoutId = setTimeout(() => {
    isApiLocked = false;
    lockTimeoutId = null;
    lockListeners.forEach((l) => l());
  }, LOCK_DURATION_MS);
}

/** For UI: show "The server is busy. Please wait 10 seconds..." when locked. */
export function getMoreInfoLockState(): { locked: boolean; retryAfterMs: number } {
  if (!isApiLocked) return { locked: false, retryAfterMs: 0 };
  const remaining = Math.max(0, lockEndTime - Date.now());
  return { locked: true, retryAfterMs: remaining };
}

export function subscribeToMoreInfoLock(listener: () => void): () => void {
  lockListeners.push(listener);
  return () => {
    const i = lockListeners.indexOf(listener);
    if (i !== -1) lockListeners.splice(i, 1);
  };
}

function isRetryableError(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 429) return true;
    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') return true;
  }
  return false;
}

/**
 * Fetches coin prices (USD, EUR, ILS) from CoinGecko /simple/price.
 * Response format: { [coinId]: { usd, eur, ils } } – must use response.data[coinId].
 * Retry: once after 3s on 429 or Network Error. Global 10s lock on 429 to avoid hammering the API.
 */
export async function fetchMoreInfo(
  coinId: string
): Promise<{ usd: number; eur: number; ils: number }> {
  const normalizedId = coinId.trim().toLowerCase();
  const cached = coinCache[normalizedId];
  if (cached && Date.now() - cached.fetchedAt < COIN_CACHE_TTL_MS) {
    return cached.data;
  }

  if (isApiLocked && Date.now() < lockEndTime) {
    throw new Error('The server is busy. Please wait 10 seconds...');
  }

  if (MORE_INFO_MIN_INTERVAL_MS > 0) {
    const now = Date.now();
    const elapsed = now - lastMoreInfoRequestTime;
    if (elapsed < MORE_INFO_MIN_INTERVAL_MS) {
      await new Promise((r) =>
        setTimeout(r, MORE_INFO_MIN_INTERVAL_MS - elapsed)
      );
    }
  }
  lastMoreInfoRequestTime = Date.now();

  async function doRequest(): Promise<{ usd: number; eur: number; ils: number }> {
    const response = await api.get<Record<string, { usd?: number; eur?: number; ils?: number }>>(
      '/simple/price',
      { params: { ids: normalizedId, vs_currencies: 'usd,eur,ils' } }
    );

    if (response.data == null || typeof response.data !== 'object') {
      console.error('[fetchMoreInfo] response.data empty or invalid:', {
        coinId: normalizedId,
        responseData: response.data,
      });
      throw new Error('Invalid response from CoinGecko');
    }

    const raw = response.data[normalizedId];
    if (raw == null) {
      console.error('[fetchMoreInfo] no data for coinId:', {
        coinId: normalizedId,
        keysInResponse: Object.keys(response.data),
      });
    }

    return {
      usd: raw?.usd ?? 0,
      eur: raw?.eur ?? 0,
      ils: raw?.ils ?? 0,
    };
  }

  let data: { usd: number; eur: number; ils: number };
  try {
    data = await doRequest();
    coinCache[normalizedId] = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    if (isRetryableError(err)) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setApiLocked();
      }
      await new Promise((r) => setTimeout(r, RETRY_WAIT_MS));
      try {
        data = await doRequest();
        coinCache[normalizedId] = { data, fetchedAt: Date.now() };
        return data;
      } catch (retryErr) {
        console.error('[fetchMoreInfo] retry failed:', { coinId: normalizedId, error: retryErr });
        throw retryErr;
      }
    }
    console.error('[fetchMoreInfo] request failed:', { coinId: normalizedId, error: err });
    throw err;
  }
}

/**
 * Fetches current USD prices for multiple coin IDs from CoinGecko.
 * @returns Map of coin ID to USD price
 */
export async function fetchPricesUsd(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const response = await api.get<Record<string, { usd: number }>>('/simple/price', {
    params: { ids: ids.join(','), vs_currencies: 'usd' },
  });
  const out: Record<string, number> = {};
  for (const [coinId, data] of Object.entries(response.data)) {
    if (data?.usd != null) out[coinId] = data.usd;
  }
  return out;
}

/** CryptoCompare public API; no API key required (free tier has rate limits). */
const CRYPTOCOMPARE_BASE = 'https://min-api.cryptocompare.com/data';

/**
 * Fetches current USD prices for multiple symbols from CryptoCompare (single API call).
 * Used by Real-Time Reports. Currency: USD only. No API key in code; use .env if you add one later.
 * @param symbols - Array of symbols (e.g. BTC, ETH, SOL)
 * @returns Map of symbol (uppercase) to USD price
 */
export async function fetchPricesUsdCryptoCompare(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};
  const fsyms = symbols.map((s) => s.toUpperCase()).join(',');
  try {
    const response = await axios.get<Record<string, { USD?: number }>>(
      `${CRYPTOCOMPARE_BASE}/pricemulti`,
      { params: { fsyms, tsyms: 'USD' }, timeout: 8000 }
    );
    const out: Record<string, number> = {};
    for (const [sym, data] of Object.entries(response.data)) {
      if (data?.USD != null) out[sym.toUpperCase()] = data.USD;
    }
    return out;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 429) {
        throw new Error('Too many requests (rate limit). Try again in a moment.');
      }
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        throw new Error('Network error. Check your connection or try again later.');
      }
    }
    throw err;
  }
}

/** CoinGecko /coins/{id} market_data shape */
interface CoinDetailMarketData {
  current_price?: { usd?: number };
  market_cap?: { usd?: number };
  total_volume?: { usd?: number };
  price_change_percentage_24h?: number | null;
  price_change_percentage_30d_in_currency?: number | { usd?: number } | null;
  price_change_percentage_60d_in_currency?: number | { usd?: number } | null;
  price_change_percentage_200d_in_currency?: number | { usd?: number } | null;
}

interface CoinDetailResponse {
  id: string;
  symbol: string;
  name: string;
  market_data?: CoinDetailMarketData;
}

export interface CoinMarketDataForAiInput {
  name: string;
  symbol: string;
  currentPriceUsd: number;
  priceChange24h: number | null;
  priceChange30d: number | null;
  priceChange60d: number | null;
  priceChange200d: number | null;
  totalVolume: number;
  marketCap: number;
}

/**
 * Fetches one coin's full market data for AI (price, 24h/30d/60d/200d changes, volume, market cap).
 * Uses CoinGecko /coins/{id}.
 */
export async function fetchCoinMarketData(coinId: string): Promise<CoinMarketDataForAiInput> {
  const response = await api.get<CoinDetailResponse>(`/coins/${coinId}`, {
    params: { localization: false, tickers: false, community_data: false, developer_data: false, sparkline: false },
  });
  const responseData = response.data;
  const marketData = responseData.market_data ?? {};
  const raw30 = marketData.price_change_percentage_30d_in_currency;
  const raw60 = marketData.price_change_percentage_60d_in_currency;
  const raw200 = marketData.price_change_percentage_200d_in_currency;
  const priceChange30d = typeof raw30 === 'number' ? raw30 : raw30?.usd ?? null;
  const priceChange60d = typeof raw60 === 'number' ? raw60 : raw60?.usd ?? null;
  const priceChange200d = typeof raw200 === 'number' ? raw200 : raw200?.usd ?? null;
  return {
    name: responseData.name ?? coinId,
    symbol: (responseData.symbol ?? '???').toUpperCase(),
    currentPriceUsd: marketData.current_price?.usd ?? 0,
    priceChange24h: marketData.price_change_percentage_24h ?? null,
    priceChange30d: priceChange30d != null ? priceChange30d : null,
    priceChange60d: priceChange60d != null ? priceChange60d : null,
    priceChange200d: priceChange200d != null ? priceChange200d : null,
    totalVolume: marketData.total_volume?.usd ?? 0,
    marketCap: marketData.market_cap?.usd ?? 0,
  };
}

