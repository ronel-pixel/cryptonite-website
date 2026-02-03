import type { FC } from 'react';
import { useEffect, useCallback } from 'react';
import type { Coin } from '../store/coinsSlice';

interface FavoritesModalProps {
  isOpen: boolean;
  coins: Coin[];
  selectedIds: string[];
  pendingId: string | null;
  onClose: () => void;
  onReplace: (removeId: string) => void;
}

const CONFIRM_REPLACE_MESSAGE =
  'This will remove the selected coin from your report list.';

const FavoritesModal: FC<FavoritesModalProps> = ({
  isOpen,
  coins,
  selectedIds,
  pendingId,
  onClose,
  onReplace,
}) => {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen || !pendingId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, pendingId, onClose]);

  if (!isOpen || !pendingId) return null;

  const selectedCoins = coins.filter((coin) => selectedIds.includes(coin.id));
  const pendingCoin = coins.find((coin) => coin.id === pendingId);
  const pendingLabel = pendingCoin
    ? `${pendingCoin.name} (${pendingCoin.symbol.toUpperCase()})`
    : 'new selection';

  const handleReplaceClick = (removeCoinId: string) => {
    const removeCoin = selectedCoins.find((coin) => coin.id === removeCoinId);
    const removeLabel = removeCoin
      ? `${removeCoin.name} (${removeCoin.symbol.toUpperCase()})`
      : 'this coin';
    const confirmed = window.confirm(
      `Replace ${removeLabel} with ${pendingLabel}? ${CONFIRM_REPLACE_MESSAGE}`
    );
    if (confirmed) onReplace(removeCoinId);
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-title">Select a coin to replace</h2>
        <p>You can only track up to 5 coins. Choose one to replace with the new selection.</p>
        <ul className="modal-list">
          {selectedCoins.map((coin) => (
            <li key={coin.id} className="modal-list-item">
              <span>
                {coin.symbol.toUpperCase()} - {coin.name}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleReplaceClick(coin.id)}
              >
                Replace
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default FavoritesModal;

