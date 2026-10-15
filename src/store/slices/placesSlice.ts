import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  FALLBACK_PROVINCES,
  fetchProvinces,
  sortProvinces,
  type Province,
} from '@/services/places';

interface PlacesState {
  /** Empty until the API answers (or fails, and the built-in copy stands in). */
  provinces: Province[];
  status: 'idle' | 'loading' | 'ready' | 'failed';
}

const initialState: PlacesState = {
  provinces: [],
  status: 'idle',
};

/**
 * Asked for once, as the app starts; screens only read the result. Asking
 * again in the same run does nothing, whether it worked or not: a failure
 * keeps the built-in copy until the app is next opened.
 */
export const loadProvinces = createAsyncThunk(
  'places/loadProvinces',
  fetchProvinces,
  {
    condition: (_, { getState }) =>
      (getState() as { places: PlacesState }).places.status === 'idle',
  },
);

const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(loadProvinces.pending, state => {
        state.status = 'loading';
      })
      .addCase(loadProvinces.fulfilled, (state, action) => {
        state.provinces = action.payload;
        state.status = 'ready';
      })
      // Only when the API can't be reached: the copy that comes with the app.
      .addCase(loadProvinces.rejected, state => {
        state.provinces = sortProvinces(FALLBACK_PROVINCES);
        state.status = 'failed';
      });
  },
});

export default placesSlice.reducer;
