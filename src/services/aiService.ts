import axios from 'axios';
import { formatPriceForDisplay } from '../utils/validation';
import { isOpenAiKeyConfigured } from '../config/env';

if (import.meta.env.DEV && !isOpenAiKeyConfigured()) {
  console.error(
    '[Cryptonite] AI Recommendation requires VITE_OPENAI_API_KEY and VITE_AI_MODEL in .env. See .env.example for required variables.'
  );
}

export interface CoinMarketDataForAi {
  name: string;
  symbol: string;
  currentPriceUsd: number;
  priceChange24h: number | null;
  priceChange30d?: number | null;
  priceChange60d?: number | null;
  priceChange200d?: number | null;
  totalVolume: number;
  marketCap: number;
}

function pct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return `${Number(value).toFixed(2)}%`;
}

function formatMarketData(data: CoinMarketDataForAi): string {
  const lines = [
    `Coin: ${data.name} (${data.symbol.toUpperCase()})`,
    `Current price (USD): $${formatPriceForDisplay(data.currentPriceUsd)}`,
    `Market cap (USD): $${formatPriceForDisplay(data.marketCap)}`,
    `24h volume (USD): $${formatPriceForDisplay(data.totalVolume)}`,
    `24h price change: ${pct(data.priceChange24h)}`,
    `30d price change: ${pct(data.priceChange30d)}`,
    `60d price change: ${pct(data.priceChange60d)}`,
    `200d price change: ${pct(data.priceChange200d)}`,
  ];
  return lines.join('\n');
}

export function buildRecommendationPrompt(data: CoinMarketDataForAi): string {
  const dataBlock = formatMarketData(data);
  return `You are a concise crypto analyst. Based on the following market data:\n\n${dataBlock}\n\nProvide:\n1. A clear recommendation: either "Buy" or "No Buy".\n2. One detailed explanatory paragraph (2-4 sentences) justifying your recommendation based on price, market cap, volume, and the 24h, 30d, 60d, and 200d price changes.`;
}

export interface AiRecommendationResult {
  content: string;
  error?: string;
}


/**
 * Sends market data to OpenAI Chat Completions API and returns the model's recommendation.
 * Uses VITE_OPENAI_API_KEY and VITE_AI_MODEL from .env. Never logs sensitive values.
 */
export async function getAiRecommendation(
  marketData: CoinMarketDataForAi
): Promise<AiRecommendationResult> {
  if (!isOpenAiKeyConfigured()) {
    return {
      content: '',
      error: 'AI API key not configured. Set VITE_OPENAI_API_KEY and VITE_AI_MODEL in your .env file (see .env.example).',
    };
  }

  
  const prompt = buildRecommendationPrompt(marketData);

  try {
    const response = await axios.post<{
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    }>(
      'api/chat/',
      {
        messages: [{ role: 'user', content: prompt }] 
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content;
    const content = typeof rawContent === 'string'
      ? rawContent.trim()
      : rawContent != null
        ? String(rawContent).trim()
        : '';
    if (content) {
      return { content };
    }
    const errMsg = response.data?.error?.message ?? 'No response from AI';
    return { content: '', error: typeof errMsg === 'string' ? errMsg : 'No response from AI' };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        return { content: '', error: 'Data currently unavailable. Please try again later.' };
      }
      const apiMessage = error.response?.data?.error?.message;
      if (apiMessage && typeof apiMessage === 'string') {
        return { content: '', error: apiMessage };
      }
    }
    return {
      content: '',
      error: 'Data currently unavailable. Please try again later.',
    };
  }
}
