import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getKnownEmails } from '../../utils/api';
import { notifyError } from '../../utils/notifications';

// Define the state type
interface EmailsState {
  knownEmails: string[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: EmailsState = {
  knownEmails: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching emails
export const fetchKnownEmails = createAsyncThunk(
  'emails/fetchKnownEmails',
  async (token: string, { rejectWithValue }) => {
    try {
      const emails = await getKnownEmails(token);
      return emails;
    } catch (error) {
      notifyError('Erreur lors de la récupération des emails connus');
      console.error('Error fetching known emails: ', error);
      return rejectWithValue('Failed to fetch emails');
    }
  },
);

// Create the slice
const emailsSlice = createSlice({
  name: 'emails',
  initialState,
  reducers: {
    clearEmails: (state) => {
      state.knownEmails = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKnownEmails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchKnownEmails.fulfilled,
        (state, action: PayloadAction<string[]>) => {
          state.knownEmails = action.payload;
          state.loading = false;
        },
      )
      .addCase(fetchKnownEmails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { clearEmails } = emailsSlice.actions;
export default emailsSlice.reducer;
