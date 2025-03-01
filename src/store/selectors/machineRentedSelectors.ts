import { RootState } from '../index';

/**
 * Selectors for machine rented state
 */
export const getMachineRentedList = (state: RootState) =>
  state.machineRented.machineRentedList;
export const getMachineRentedLoading = (state: RootState) =>
  state.machineRented.loading;
export const getMachineRentedError = (state: RootState) =>
  state.machineRented.error;