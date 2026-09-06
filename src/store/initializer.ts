import { useEffect } from 'react';
import { useAppDispatch } from './hooks';
import { fetchKnownEmails } from './slices/emailsSlice';
import { fetchMachineRented } from './slices/machineRentedSlice';
import { fetchMachineRental } from './slices/machineRentalSlice';
import { fetchConfigData } from './slices/configSlice';
import { useAuth } from '../hooks/AuthProvider';
import { ALLOWED_ROLES } from '../hooks/session';

/**
 * A component that initializes the Redux store with data when the app starts.
 */
export const StoreInitializer = (): null => {
  const dispatch = useAppDispatch();
  const { token, hasRole, ssoEnabled } = useAuth();

  // Le rôle est vérifié ici, pas seulement dans la garde de route.
  //
  // En mode SSO, `token` est une sentinelle non vide : elle est vraie pour
  // *toute* session authentifiée, y compris une session sans rôle admis. Cet
  // effet vit au-dessus d'`AuthRoute`, donc ces quatre appels partaient quand
  // même et repartaient en 403. Même défaut que le retour R027 n° 23, trouvé
  // ici en le corrigeant sur `forestar-rental-operator`.
  const allowed = !ssoEnabled || hasRole(...ALLOWED_ROLES);

  useEffect(() => {
    if (token && allowed) {
      dispatch(fetchMachineRented(token));
      dispatch(fetchMachineRental(token));
      dispatch(fetchKnownEmails(token));
      dispatch(fetchConfigData(token));
    }
  }, [dispatch, token, allowed]);

  return null;
};
