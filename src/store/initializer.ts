import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { fetchKnownEmails } from './slices/emailsSlice';
import { fetchMachineRented } from './slices/machineRentedSlice';
import { fetchMachineRental } from './slices/machineRentalSlice';
import { fetchConfigData } from './slices/configSlice';
import { useAuth } from '../hooks/AuthProvider';
// Import selectors - these can be used to check if data is already loaded
import {
  getKnownEmails,
  getMachineRentedList,
  getMachineRentalList,
  getConfig,
} from './selectors';

/**
 * A component that initializes the Redux store with data when the app starts
 */
export const StoreInitializer = (): null => {
  const dispatch = useAppDispatch();
  const { token } = useAuth();

  // Use selectors to check if data is already loaded
  const knownEmails = useAppSelector(getKnownEmails);
  const machineRentedList = useAppSelector(getMachineRentedList);
  const machineRentalList = useAppSelector(getMachineRentalList);
  const config = useAppSelector(getConfig);

  useEffect(() => {
    if (token) {
      // Only fetch data if not already loaded
      if (knownEmails.length === 0) {
        dispatch(fetchKnownEmails(token));
      }

      if (machineRentedList.length === 0) {
        dispatch(fetchMachineRented(token));
      }

      if (machineRentalList.length === 0) {
        dispatch(fetchMachineRental(token));
      }

      if (config.length === 0) {
        dispatch(fetchConfigData(token));
      }
    }
  }, [
    dispatch,
    token,
    knownEmails.length,
    machineRentedList.length,
    machineRentalList.length,
    config.length,
  ]);

  return null;
};
