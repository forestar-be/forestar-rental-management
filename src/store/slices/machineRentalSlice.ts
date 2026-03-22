import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllMachineRental } from '../../utils/api';
import { MachineRentalWithMachineRented } from '../../utils/types';
import { notifyError } from '../../utils/notifications';
import { RootState } from '../index';

const STALE_THRESHOLD_MS = 30_000; // 30 seconds

// Define the state type
interface MachineRentalState {
  machineRentalList: MachineRentalWithMachineRented[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

// Initial state
const initialState: MachineRentalState = {
  machineRentalList: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Create async thunk for fetching machine rental list
export const fetchMachineRental = createAsyncThunk(
  'machineRental/fetchMachineRental',
  async (token: string, { rejectWithValue }) => {
    try {
      const data = await getAllMachineRental(token);
      return data;
    } catch (error) {
      notifyError('Erreur lors de la récupération des locations de machines');
      console.error('Error fetching machine rental list: ', error);
      return rejectWithValue('Failed to fetch machine rental list');
    }
  },
);

// Thunk that only fetches if data is stale (>30s since last fetch)
export const fetchMachineRentalIfStale = createAsyncThunk(
  'machineRental/fetchMachineRentalIfStale',
  async (token: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const { lastFetched } = state.machineRental;
    const now = Date.now();
    if (!lastFetched || now - lastFetched > STALE_THRESHOLD_MS) {
      await dispatch(fetchMachineRental(token)).unwrap();
    }
  },
);

// Create the slice
const machineRentalSlice = createSlice({
  name: 'machineRental',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMachineRental.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMachineRental.fulfilled,
        (state, action: PayloadAction<MachineRentalWithMachineRented[]>) => {
          state.machineRentalList = action.payload;
          state.loading = false;
          state.lastFetched = Date.now();
        },
      )
      .addCase(fetchMachineRental.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default machineRentalSlice.reducer;
