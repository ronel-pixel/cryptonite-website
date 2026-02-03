import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, fetchMoreInfo } from '../services/api';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume?: number;
  price_change_percentage_24h?: number | null;
}

export interface CoinPriceDetails {
  usd: number;
  eur: number;
  ils: number;
}

interface CoinsState {
  items: Coin[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  moreInfo: Record<string, { loading: boolean; error: string | null; data: CoinPriceDetails | null }>;
}

const initialState: CoinsState = {
  items: [],
  loading: false,
  error: null,
  searchTerm: '',
  moreInfo: {},
};

/** Fetches top 100 coins by market cap from CoinGecko; does NOT use coinCache. */
export const fetchTopCoins = createAsyncThunk<Coin[]>(
  'coins/fetchTopCoins',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(
        '/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false,
          },
        },
      );
      return response.data as Coin[];
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { message?: string })?.message ?? 'Failed to load coins';
      console.error('fetchTopCoins failed:', { status, message, err });
      return rejectWithValue({ status, message });
    }
  },
);

/** Fetches USD, EUR, ILS for a single coin via CoinGecko /simple/price (cached + throttled in api). */
export const fetchCoinPrices = createAsyncThunk<
  { id: string; details: CoinPriceDetails },
  string,
  { rejectValue: string }
>('coins/fetchCoinPrices', async (coinId: string, { rejectWithValue }) => {
  try {
    const details = await fetchMoreInfo(coinId);
    const priceData = { id: coinId, details };
    return priceData;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to load coin prices';
    return rejectWithValue(message);
  }
});

const coinsSlice = createSlice({
  name: 'coins',
  initialState,
  reducers: {
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopCoins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopCoins.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTopCoins.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        state.error = payload?.message ?? action.error.message ?? 'Failed to load coins';
      })
      .addCase(fetchCoinPrices.pending, (state, action) => {
        const coinId = action.meta.arg;
        state.moreInfo[coinId] = {
          loading: true,
          error: null,
          data: state.moreInfo[coinId]?.data ?? null,
        };
      })
      .addCase(fetchCoinPrices.fulfilled, (state, action) => {
        const { id: coinId, details } = action.payload;
        state.moreInfo[coinId] = {
          loading: false,
          error: null,
          data: details,
        };
      })
      .addCase(fetchCoinPrices.rejected, (state, action) => {
        const coinId = action.meta.arg;
        const message =
          action.payload ??
          action.error.message ??
          'Failed to load coin prices';
        state.moreInfo[coinId] = {
          loading: false,
          error: message,
          data: null,
        };
      });
  },
});

export const { setSearchTerm } = coinsSlice.actions;
export default coinsSlice.reducer;

