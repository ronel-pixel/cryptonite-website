import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AiRecommendation {
  id: string;
  reason: string;
}

interface AiState {
  recommendations: AiRecommendation[];
  loading: boolean;
  error: string | null;
}

const initialState: AiState = {
  recommendations: [],
  loading: false,
  error: null,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setRecommendations(state, action: PayloadAction<AiRecommendation[]>) {
      state.recommendations = action.payload;
    },
  },
});

export const { setRecommendations } = aiSlice.actions;
export default aiSlice.reducer;

