import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../hooks/reduxHooks';
import type { Coin } from '../store/coinsSlice';
import { fetchCoinMarketData, type CoinMarketDataForAiInput } from '../services/api';
import {
  getAiRecommendation,
  type CoinMarketDataForAi,
  type AiRecommendationResult,
} from '../services/aiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ReportTerminal from '../components/ReportTerminal';

interface AiRecommendationState {
  content: string;
  error: string | null;
}

function normalizeAiContent(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null && 'content' in raw && typeof (raw as { content: unknown }).content === 'string') {
    return (raw as { content: string }).content;
  }
  try {
    return String(raw);
  } catch {
    return '';
  }
}

/** AI Recommendation page: select a favorite coin and get a Buy/No Buy recommendation from OpenAI. Handles API errors (e.g. 429) with a user-friendly message. */
export default function AIRecommendation() {
  const coins = useAppSelector((state) => state.coins.items);
  const favoriteIds = useAppSelector((state) => state.favorites.selectedIds);

  const selectedCoins: Coin[] = favoriteIds
    .map((id) => coins.find((c) => c.id === id))
    .filter((c): c is Coin => c != null);

  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<AiRecommendationState | null>(null);

  const handleSelect = useCallback((coin: Coin) => {
    setSelectedCoin(coin);
    setRecommendationResult(null);
  }, []);

  const handleGetRecommendation = useCallback(async () => {
    const coin = selectedCoin;
    if (!coin?.id) return;

    setLoading(true);
    setRecommendationResult(null);

    try {
      const marketData: CoinMarketDataForAiInput = await fetchCoinMarketData(coin.id);
      if (!marketData || typeof marketData !== 'object') {
        setRecommendationResult({
          content: '',
          error: 'Invalid market data received. Please try again.',
        });
        return;
      }

      const payloadForAi: CoinMarketDataForAi = {
        name: marketData.name ?? coin.name ?? 'Unknown',
        symbol: marketData.symbol ?? coin.symbol ?? '???',
        currentPriceUsd: Number(marketData.currentPriceUsd) || 0,
        priceChange24h: marketData.priceChange24h != null ? Number(marketData.priceChange24h) : null,
        priceChange30d: marketData.priceChange30d != null ? Number(marketData.priceChange30d) : null,
        priceChange60d: marketData.priceChange60d != null ? Number(marketData.priceChange60d) : null,
        priceChange200d: marketData.priceChange200d != null ? Number(marketData.priceChange200d) : null,
        totalVolume: Number(marketData.totalVolume) || 0,
        marketCap: Number(marketData.marketCap) || 0,
      };

      const aiResponse: AiRecommendationResult = await getAiRecommendation(payloadForAi);

      setRecommendationResult({
        content: normalizeAiContent(aiResponse?.content ?? ''),
        error: aiResponse?.error != null ? String(aiResponse.error) : null,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get recommendation';
      setRecommendationResult({
        content: '',
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCoin]);

  const hasResult = recommendationResult != null;
  const resultError = recommendationResult?.error ?? null;
  const resultContent = recommendationResult?.content ?? '';

  if (selectedCoins.length === 0) {
    return (
      <section className="ai-page" aria-label="AI Recommendation">
        <header className="ai-page__header">
          <h1>AI Recommendation</h1>
          <p>Select up to 5 coins on the Home page to get AI buy/no-buy recommendations here.</p>
        </header>
        <div className="reports-empty" style={{ marginTop: '1rem' }}>
          <h2>No coins selected</h2>
          <p>Use the switches on the Home page to mark up to 5 coins for reports and AI recommendations.</p>
          <Link to="/" className="btn btn-primary">
            Go to Home to select coins
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ai-page" aria-label="AI Recommendation">
      <header className="ai-page__header">
        <h1>AI Recommendation</h1>
        <p>Choose one of your selected coins to get a Buy/No Buy recommendation and a detailed explanation.</p>
      </header>

      <div className="ai-page__selector-wrap">
        <span className="ai-page__label">Select one coin</span>
        <div className="ai-page__coin-buttons" role="radiogroup" aria-label="Select coin for AI recommendation">
          {selectedCoins.map((coin) => (
            <label key={coin.id} className="ai-page__coin-option">
              <input
                type="radio"
                name="ai-coin"
                value={coin.id}
                checked={selectedCoin?.id === coin.id}
                onChange={() => handleSelect(coin)}
                className="ai-page__coin-radio"
              />
              <span className="ai-page__coin-option-label">
                {coin.image && (
                  <img src={coin.image} alt="" className="ai-page__dropdown-coin-icon" />
                )}
                <span>{coin.name}</span>
                <span className="ai-page__dropdown-symbol">{(coin.symbol ?? '???').toUpperCase()}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {selectedCoin ? (
        <div className="ai-page__selected">
          <span className="ai-page__selected-label">Selected:</span>
          <span className="ai-page__selected-name">
            {selectedCoin.name} ({(selectedCoin.symbol ?? '???').toUpperCase()})
          </span>
        </div>
      ) : (
        <div className="ai-page__empty-selection" role="status">
          <p>Select a coin above to get an AI recommendation.</p>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary ai-page__submit"
        onClick={handleGetRecommendation}
        disabled={!selectedCoin || loading}
      >
        Get AI Recommendation
      </button>

      {loading && (
        <div className="ai-page__loading">
          <LoadingSpinner size={48} />
          <p>Asking AI for recommendation...</p>
        </div>
      )}

      {!loading && hasResult && (
        <ReportTerminal
          title={resultError ? 'Error' : 'AI Recommendation'}
          className={resultError ? 'report-terminal--error' : ''}
        >
          {resultError ? (
            <p className="report-terminal__error">{resultError}</p>
          ) : (
            <pre className="report-terminal__pre">{resultContent}</pre>
          )}
        </ReportTerminal>
      )}
    </section>
  );
}
