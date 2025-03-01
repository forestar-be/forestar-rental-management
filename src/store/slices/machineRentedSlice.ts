import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllMachineRented } from '../../utils/api';
import { MachineRentedSimpleWithImage } from '../../utils/types';
import { notifyError } from '../../utils/notifications';

// Define the state type
interface MachineRentedState {
  machineRentedList: MachineRentedSimpleWithImage[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: MachineRentedState = {
  machineRentedList: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching machine rented list
export const fetchMachineRented = createAsyncThunk(
  'machineRented/fetchMachineRented',
  async (token: string, { rejectWithValue }) => {
    try {
      const machines = await getAllMachineRented(token, true);
      return machines;
    } catch (error) {
      notifyError('Erreur lors de la récupération des machines louées');
      console.error('Error fetching machine rented list: ', error);
      return rejectWithValue('Failed to fetch machine rented list');
    }
  },
);

// Create the slice
const machineRentedSlice = createSlice({
  name: 'machineRented',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMachineRented.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMachineRented.fulfilled,
        (state, action: PayloadAction<MachineRentedSimpleWithImage[]>) => {
          state.machineRentedList = action.payload;
          state.loading = false;
        },
      )
      .addCase(fetchMachineRented.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default machineRentedSlice.reducer;
