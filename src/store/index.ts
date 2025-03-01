import { configureStore } from '@reduxjs/toolkit';
import emailsReducer from './slices/emailsSlice';
import machineRentedReducer from './slices/machineRentedSlice';
import machineRentalReducer from './slices/machineRentalSlice';
import configReducer from './slices/configSlice';

// Configure the store
const store = configureStore({
  reducer: {
    emails: emailsReducer,
    machineRented: machineRentedReducer,
    machineRental: machineRentalReducer,
    config: configReducer,
  },
});

// Define RootState type
export type RootState = ReturnType<typeof store.getState>;
// Define AppDispatch type
export type AppDispatch = typeof store.dispatch;

export default store;
