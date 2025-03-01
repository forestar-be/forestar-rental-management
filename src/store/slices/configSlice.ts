import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchConfig,
  addConfig,
  updateConfig,
  deleteConfig,
} from '../../utils/api';
import { ConfigElement } from '../../utils/types';
import { notifyError } from '../../utils/notifications';

// Define the state type
interface ConfigState {
  config: ConfigElement[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: ConfigState = {
  config: [],
  loading: false,
  error: null,
};

// Create async thunks for config operations
export const fetchConfigData = createAsyncThunk(
  'config/fetchConfigData',
  async (token: string, { rejectWithValue }) => {
    try {
      const configData = await fetchConfig(token);
      return configData;
    } catch (error) {
      notifyError('Erreur lors de la récupération de la configuration');
      console.error('Error fetching config: ', error);
      return rejectWithValue('Failed to fetch config');
    }
  },
);

export const addConfigElement = createAsyncThunk(
  'config/addConfigElement',
  async (
    { token, configElement }: { token: string; configElement: ConfigElement },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await addConfig(token, configElement);
      // Refresh config after adding
      dispatch(fetchConfigData(token));
      return configElement;
    } catch (error) {
      notifyError(`Erreur lors de l'ajout de ${configElement.key}`);
      console.error(`Error adding config ${configElement.key}: `, error);
      return rejectWithValue('Failed to add config element');
    }
  },
);

export const updateConfigElement = createAsyncThunk(
  'config/updateConfigElement',
  async (
    { token, configElement }: { token: string; configElement: ConfigElement },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await updateConfig(token, configElement);
      // Refresh config after updating
      dispatch(fetchConfigData(token));
      return configElement;
    } catch (error) {
      notifyError(`Erreur lors de la mise à jour de ${configElement.key}`);
      console.error(`Error updating config ${configElement.key}: `, error);
      return rejectWithValue('Failed to update config element');
    }
  },
);

export const deleteConfigElement = createAsyncThunk(
  'config/deleteConfigElement',
  async (
    { token, key }: { token: string; key: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await deleteConfig(token, key);
      // Refresh config after deleting
      dispatch(fetchConfigData(token));
      return key;
    } catch (error) {
      notifyError(`Erreur lors de la suppression de ${key}`);
      console.error(`Error deleting config ${key}: `, error);
      return rejectWithValue('Failed to delete config element');
    }
  },
);

// Create the slice
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchConfigData
      .addCase(fetchConfigData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchConfigData.fulfilled,
        (state, action: PayloadAction<ConfigElement[]>) => {
          state.config = action.payload;
          state.loading = false;
        },
      )
      .addCase(fetchConfigData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // We don't need to handle other thunks' states since they dispatch fetchConfigData
  },
});

export default configSlice.reducer;
