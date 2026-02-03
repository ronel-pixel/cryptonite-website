import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { fetchTopCoins } from '../store/coinsSlice';
import type { Coin } from '../store/coinsSlice';
import { replaceFavorite, toggleFavorite, MAX_FAVORITES } from '../store/favoritesSlice';
import { getMoreInfoLockState, subscribeToMoreInfoLock } from '../services/api';
import CoinCard from '../components/CoinCard';
import FavoritesModal from '../components/FavoritesModal';

const CONFIRM_REMOVE_FAVORITE_MESSAGE =
  'Remove this coin from your report list? You can add it again from the Home page.';

type SortOption = 'price_desc' | 'price_asc' | 'change_desc' | 'change_asc';

function sortCoins(coins: Coin[], sortBy: SortOption): Coin[] {
  const sorted = [...coins];
  const getChange = (c: Coin) => c.price_change_percentage_24h ?? -Infinity;
  const getChangeForAsc = (c: Coin) => c.price_change_percentage_24h ?? Infinity;

  switch (sortBy) {
    case 'price_desc':
      return sorted.sort((a, b) => b.current_price - a.current_price);
    case 'price_asc':
      return sorted.sort((a, b) => a.current_price - b.current_price);
    case 'change_desc':
      return sorted.sort((a, b) => getChange(b) - getChange(a));
    case 'change_asc':
      return sorted.sort((a, b) => getChangeForAsc(a) - getChangeForAsc(b));
    default:
      return sorted;
  }
}

function Home() {
  const dispatch = useAppDispatch();
  const { items, loading, error, searchTerm } = useAppSelector((state) => state.coins);
  const favorites = useAppSelector((state) => state.favorites.selectedIds);
  const [pendingCoinId, setPendingCoinId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('price_desc');
  const [isInitialDelay, setIsInitialDelay] = useState(true);
  const [moreInfoLocked, setMoreInfoLocked] = useState(() => getMoreInfoLockState().locked);

  useEffect(() => {
    const unsub = subscribeToMoreInfoLock(() => setMoreInfoLocked(getMoreInfoLockState().locked));
    setMoreInfoLocked(getMoreInfoLockState().locked);
    return unsub;
  }, []);

  /** Fetch 100 coins only once; stored in Redux. 2s delay before first fetch to reduce 429 risk. */
  useEffect(() => {
    if (items.length === 0) {
      setIsInitialDelay(true);
      const t = setTimeout(() => {
        dispatch(fetchTopCoins());
        setIsInitialDelay(false);
      }, 2000);
      return () => clearTimeout(t);
    } else {
      setIsInitialDelay(false);
    }
  }, [dispatch, items.length]);

  const handleToggle = (coinId: string) => {
    const isAlreadySelected = favorites.includes(coinId);

    if (isAlreadySelected) {
      const coin = items.find((item) => item.id === coinId);
      const coinLabel = coin ? `${coin.name} (${coin.symbol.toUpperCase()})` : 'this coin';
      const confirmed = window.confirm(
        `Remove ${coinLabel} from your report list? ${CONFIRM_REMOVE_FAVORITE_MESSAGE}`
      );
      if (!confirmed) return;
      dispatch(toggleFavorite(coinId));
      return;
    }

    if (favorites.length >= MAX_FAVORITES) {
      setPendingCoinId(coinId);
      setIsModalOpen(true);
      return;
    }

    dispatch(toggleFavorite(coinId));
  };

  const handleReplace = (removeCoinId: string) => {
    if (!pendingCoinId) return;
    dispatch(replaceFavorite({ removeId: removeCoinId, addId: pendingCoinId }));
    setPendingCoinId(null);
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPendingCoinId(null);
  };

  const { filteredCoins, hasPinnedInView } = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? items.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.symbol.toLowerCase().includes(term)
        )
      : items;

    const pinned = filtered.filter((c) => favorites.includes(c.id));
    const rest = filtered.filter((c) => !favorites.includes(c.id));
    const sortedPinned = sortCoins(pinned, sortBy);
    const sortedRest = sortCoins(rest, sortBy);
    return {
      filteredCoins: [...sortedPinned, ...sortedRest],
      hasPinnedInView: pinned.length > 0,
    };
  }, [items, searchTerm, favorites, sortBy]);

  return (
    <section className="home-page" aria-label="Home - Top 100 coins">
      {moreInfoLocked && (
        <div className="error-state" role="alert">
          <p className="error-text">The server is busy. Please wait 10 seconds...</p>
        </div>
      )}
      {(isInitialDelay || loading) && (
        <div className="loading-state">
          <p>Loading coins...</p>
        </div>
      )}
      {error && (
        <div className="error-state error-state--with-retry">
          <p className="error-text">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => dispatch(fetchTopCoins())}
          >
            Retry
          </button>
        </div>
      )}

      {!isInitialDelay && !loading && !error && (
        <>
          {filteredCoins.length === 0 ? (
            <div className="empty-state">
              <p>No coins found matching your search.</p>
            </div>
          ) : (
            <>
              <div className="coins-sort-bar">
                <span className="coins-sort-bar__label">Sort by</span>
                <select
                  className="coins-sort-bar__select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort coins"
                >
                  <option value="price_desc">Price: High → Low</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="change_desc">24h: Gainers</option>
                  <option value="change_asc">24h: Losers</option>
                </select>
              </div>
              {hasPinnedInView && (
                <h2 className="coins-section-label">Your Top Interests</h2>
              )}
              <div className="coins-grid">
                {filteredCoins.map((coin) => (
                  <CoinCard
                    key={coin.id}
                    coin={coin}
                    isSelected={favorites.includes(coin.id)}
                    onToggle={() => handleToggle(coin.id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <FavoritesModal
        isOpen={isModalOpen}
        coins={items}
        selectedIds={favorites}
        pendingId={pendingCoinId}
        onClose={handleCloseModal}
        onReplace={handleReplace}
      />
    </section>
  );
}

export default Home;

