import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FavoritesState {
  selectedIds: string[];
}

const MAX_FAVORITES = 5;

const initialState: FavoritesState = {
  selectedIds: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<string>) {
      const coinId = action.payload;
      if (state.selectedIds.includes(coinId)) {
        state.selectedIds = state.selectedIds.filter((id) => id !== coinId);
      } else if (state.selectedIds.length < MAX_FAVORITES) {
        state.selectedIds.push(coinId);
      }
    },
    replaceFavorite(
      state,
      action: PayloadAction<{ removeId: string; addId: string }>,
    ) {
      const { removeId, addId } = action.payload;
      state.selectedIds = state.selectedIds.filter((id) => id !== removeId);
      if (!state.selectedIds.includes(addId) && state.selectedIds.length < MAX_FAVORITES) {
        state.selectedIds.push(addId);
      }
    },
  },
});

export const { toggleFavorite, replaceFavorite } = favoritesSlice.actions;
export { MAX_FAVORITES };
export default favoritesSlice.reducer;

