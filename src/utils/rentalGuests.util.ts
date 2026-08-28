export interface ReadOnlyGuest {
  email: string;
  tooltip: string;
}

export const DELIVERY_GUEST_TOOLTIP =
  'Ajouté automatiquement car la location est avec livraison. Modifiez l’adresse dans Paramètres → Email du livreur.';

export function getDeliveryGuestDisplay(
  withShipping: boolean,
  deliveryEmail: string | null,
  configLoading = false,
): { readOnlyGuests: ReadOnlyGuest[]; warning?: string } {
  if (!withShipping) return { readOnlyGuests: [] };
  if (configLoading) return { readOnlyGuests: [] };

  const email = deliveryEmail?.trim();
  if (!email) {
    return {
      readOnlyGuests: [],
      warning: 'Email livreur non configuré',
    };
  }

  return {
    readOnlyGuests: [{ email, tooltip: DELIVERY_GUEST_TOOLTIP }],
  };
}
