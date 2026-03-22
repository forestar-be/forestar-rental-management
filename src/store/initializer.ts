import { useEffect } from 'react';
import { useAppDispatch } from './hooks';
import { fetchKnownEmails } from './slices/emailsSlice';
import { fetchMachineRented } from './slices/machineRentedSlice';
import { fetchMachineRental } from './slices/machineRentalSlice';
import { fetchConfigData } from './slices/configSlice';
import { useAuth } from '../hooks/AuthProvider';

/**
 * A component that initializes the Redux store with data when the app starts.
 */
export const StoreInitializer = (): null => {
  const dispatch = useAppDispatch();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      dispatch(fetchMachineRented(token));
      dispatch(fetchMachineRental(token));
      dispatch(fetchKnownEmails(token));
      dispatch(fetchConfigData(token));
    }
  }, [dispatch, token]);

  return null;
};
