import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppSelector } from '../hooks/reduxHooks';
import { fetchPricesUsdCryptoCompare } from '../services/api';

/** 10s to avoid rate limits on free CryptoCompare tier; interval is cleared on unmount. */
const POLL_INTERVAL_MS = 10000;
const MAX_DATA_POINTS = 30;

/** Formats a Date as HH:mm:ss for chart X-axis labels. */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const CHART_COLORS = ['#38bdf8', '#22c55e', '#a78bfa', '#f59e0b', '#ef4444'];

export default function Reports() {
  const favoriteIds = useAppSelector((state) => state.favorites.selectedIds);
  const coins = useAppSelector((state) => state.coins.items);
  const [priceHistory, setPriceHistory] = useState<Array<Record<string, string | number>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const coinLabels: Record<string, string> = {};
  favoriteIds.forEach((coinId) => {
    const coin = coins.find((item) => item.id === coinId);
    coinLabels[coinId] = coin ? coin.symbol.toUpperCase() : coinId;
  });

  /** Single CryptoCompare API call for all selected symbols (USD only); appends one point to history. */
  const fetchAndAppend = useCallback(async () => {
    if (favoriteIds.length === 0) return;
    const symbols = favoriteIds.map((id) => {
      const c = coins.find((item) => item.id === id);
      return c ? c.symbol.toUpperCase() : id.toUpperCase();
    });
    setError(null);
    try {
      const pricesBySymbol = await fetchPricesUsdCryptoCompare(symbols);
      const now = new Date();
      const point: Record<string, string | number> = { time: formatTime(now) };
      favoriteIds.forEach((coinId) => {
        const coin = coins.find((item) => item.id === coinId);
        const sym = coin ? coin.symbol.toUpperCase() : coinId.toUpperCase();
        point[coinId] = pricesBySymbol[sym] ?? 0;
      });
      setPriceHistory((prev) => {
        const next = [...prev, point];
        if (next.length > MAX_DATA_POINTS) return next.slice(-MAX_DATA_POINTS);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, [favoriteIds, coins]);

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAndAppend();

    const id = setInterval(fetchAndAppend, POLL_INTERVAL_MS);
    intervalRef.current = id;
    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [favoriteIds, fetchAndAppend]);

  if (favoriteIds.length === 0) {
    return (
      <section className="reports-page" aria-label="Real-Time Reports">
        <div className="reports-empty">
          <h2>No coins selected</h2>
          <p>Select up to 5 coins on the Home page using the toggle switches to see real-time price reports here.</p>
          <Link to="/" className="btn btn-primary">
            Go to Home to select coins
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="reports-page" aria-label="Real-Time Reports">
      <header className="reports-header">
        <h1>Real-Time Reports</h1>
        <p>Live USD prices for your selected coins (updates every {POLL_INTERVAL_MS / 1000}s)</p>
      </header>

      {error && (
        <div className="reports-error reports-error--with-retry">
          <p className="error-text">{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => fetchAndAppend()}>
            Retry
          </button>
        </div>
      )}

      {loading && priceHistory.length === 0 ? (
        <div className="loading-state">
          <p>Loading prices...</p>
        </div>
      ) : (
        <div className="reports-chart-wrap">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={priceHistory}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => [value != null ? `$${Number(value).toLocaleString()}` : '', undefined]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => coinLabels[value] ?? value}
              />
              {favoriteIds.map((coinId, index) => (
                <Line
                  key={coinId}
                  type="monotone"
                  dataKey={coinId}
                  name={coinId}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
