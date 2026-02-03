import type { FC } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Coin } from '../store/coinsSlice';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { fetchCoinPrices } from '../store/coinsSlice';
import { formatPriceForDisplay } from '../utils/validation';
import ToggleSwitch from './ToggleSwitch';

interface CoinCardProps {
  coin: Coin;
  isSelected: boolean;
  onToggle: () => void;
}

/** Renders a single coin with price, market cap, favorite toggle, and expandable "More Info" (API retry on 429). */
const CoinCard: FC<CoinCardProps> = ({ coin, isSelected, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const moreInfo = useAppSelector((state) => state.coins.moreInfo[coin.id]);

  const handleMoreInfo = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    /* Only fetch if data is not already in Redux from a previous click. */
    if (nextOpen && !moreInfo?.data && !moreInfo?.loading) {
      dispatch(fetchCoinPrices(coin.id));
    }
  };

  return (
    <div className="coin-card">
      <div className="coin-card-header">
        <img src={coin.image} alt={coin.name} className="coin-icon" />
        <div className="coin-info">
          <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
          <span className="coin-name">{coin.name}</span>
        </div>
        <ToggleSwitch checked={isSelected} onChange={onToggle} />
      </div>

      <div className="coin-card-body">
        <p className="coin-price">Price: ${formatPriceForDisplay(coin.current_price)}</p>
        <p className="coin-marketcap">
          Market Cap: ${formatPriceForDisplay(coin.market_cap)}
        </p>
      </div>

      <button type="button" className="btn btn-outline" onClick={handleMoreInfo}>
        {isOpen ? 'Hide Info' : 'More Info'}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="coin-more-info"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {moreInfo?.loading && <p>Loading...</p>}
            {moreInfo?.error && (
              <div className="coin-more-info-error">
                <p className="error-text">{moreInfo.error}</p>
                <button
                  type="button"
                  className="btn btn-outline coin-more-info-retry"
                  onClick={() => dispatch(fetchCoinPrices(coin.id))}
                >
                  Retry
                </button>
              </div>
            )}
            {moreInfo?.data && (
              <ul>
                <li>USD: ${formatPriceForDisplay(moreInfo.data.usd)}</li>
                <li>EUR: €{formatPriceForDisplay(moreInfo.data.eur)}</li>
                <li>ILS: ₪{formatPriceForDisplay(moreInfo.data.ils)}</li>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoinCard;

