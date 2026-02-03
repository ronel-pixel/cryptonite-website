/**
 * Central environment variable names and access.
 * All VITE_* vars are exposed by Vite; never log sensitive values in production.
 */

const ENV_KEYS = {
  COINGECKO_API_URL: 'VITE_COINGECKO_API_URL',
  OPENAI_API_KEY: 'VITE_OPENAI_API_KEY',
  AI_MODEL: 'VITE_AI_MODEL',
} as const;

/** Placeholder values that indicate the key was not set by the user. */
const PLACEHOLDER_VALUES = new Set([
  '',
  'your_key',
  'YOUR_API_KEY_HERE',
  'your_api_key_here',
]);

function getEnv(key: string): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : undefined;
}

export function getCoinGeckoApiUrl(): string {
  return getEnv(ENV_KEYS.COINGECKO_API_URL) ?? 'https://api.coingecko.com/api/v3';
}

export function getOpenAiApiKey(): string {
  return getEnv(ENV_KEYS.OPENAI_API_KEY) ?? '';
}

export function getAiModel(): string {
  return getEnv(ENV_KEYS.AI_MODEL) ?? 'gpt-4o-mini';
}

export function isOpenAiKeyConfigured(): boolean {
  const key = getOpenAiApiKey();
  return key.length > 0 && !PLACEHOLDER_VALUES.has(key.trim());
}

export function isCoinGeckoUrlConfigured(): boolean {
  const url = getEnv(ENV_KEYS.COINGECKO_API_URL);
  return typeof url === 'string' && url.trim().length > 0;
}

export function isAiModelConfigured(): boolean {
  const model = getEnv(ENV_KEYS.AI_MODEL);
  return typeof model === 'string' && model.trim().length > 0;
}

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * Validates that required environment variables are defined (and not placeholders).
 * Call at app startup or before using AI/API. Never logs sensitive values.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];

  const coinGeckoUrl = getEnv(ENV_KEYS.COINGECKO_API_URL);
  if (!coinGeckoUrl || coinGeckoUrl.trim().length === 0) {
    missing.push(ENV_KEYS.COINGECKO_API_URL);
  }

  const openAiKey = getOpenAiApiKey();
  if (!openAiKey || openAiKey.trim().length === 0 || PLACEHOLDER_VALUES.has(openAiKey.trim())) {
    missing.push(ENV_KEYS.OPENAI_API_KEY);
  }

  const aiModel = getEnv(ENV_KEYS.AI_MODEL);
  if (!aiModel || aiModel.trim().length === 0) {
    missing.push(ENV_KEYS.AI_MODEL);
  }

  const valid = missing.length === 0;

  if (!valid && import.meta.env.DEV) {
    console.error(
      '[Cryptonite] Missing or invalid environment variables. Add them to your .env file (see .env.example):',
      missing
    );
  }

  return { valid, missing };
}
