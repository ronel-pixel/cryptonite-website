import { configureStore } from '@reduxjs/toolkit';
import coinsReducer from './coinsSlice';
import favoritesReducer from './favoritesSlice';
import aiReducer from './aiSlice';
import { FAVORITES_STORAGE_KEY } from '../constants/storageKeys';
import { MAX_FAVORITES } from './favoritesSlice';

/**
 * Loads persisted favorite coin IDs from localStorage.
 * Returns at most MAX_FAVORITES valid string IDs; invalid entries are skipped.
 */
function loadPersistedFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw == null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const ids = parsed.filter((item): item is string => typeof item === 'string');
    return ids.slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

const preloadedState = {
  favorites: { selectedIds: loadPersistedFavorites() },
};

export const store = configureStore({
  reducer: {
    coins: coinsReducer,
    favorites: favoritesReducer,
    ai: aiReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  const state = store.getState();
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(state.favorites.selectedIds));
  } catch {
    // Ignore storage quota or disabled localStorage
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

