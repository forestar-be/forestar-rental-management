import { RootState } from '../index';

/**
 * Selectors for config state
 */
export const getConfig = (state: RootState) => state.config.config;
export const getConfigLoading = (state: RootState) => state.config.loading;
export const getConfigError = (state: RootState) => state.config.error;

export const getConfigByKey = (key: string) => (state: RootState) =>
  state.config.config.find((config) => config.key === key)?.value || null;
export const getPriceShipping = (state: RootState) =>
  Number(getConfigByKey('Prix livraison')(state)) || 0;
export const getRentalPaymentDeadlineHours = (state: RootState) =>
  Number(getConfigByKey('Délai paiement location (heures)')(state)) || 24;
