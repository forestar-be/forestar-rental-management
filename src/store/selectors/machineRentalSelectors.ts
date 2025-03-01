import { RootState } from '../index';

/**
 * Selectors for machine rental state
 */
export const getMachineRentalList = (state: RootState) =>
  state.machineRental.machineRentalList;
export const getMachineRentalLoading = (state: RootState) =>
  state.machineRental.loading;
export const getMachineRentalError = (state: RootState) =>
  state.machineRental.error;