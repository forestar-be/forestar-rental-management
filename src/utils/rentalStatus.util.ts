import { MachineRental } from './types';

export type RentalDisplayStatus =
  | 'PENDING_APPROVAL'
  | 'UNPAID'
  | 'PAYMENT_PENDING'
  | 'OVERDUE'
  | 'PAID'
  | 'CANCELLED';

export function hasRentalPaymentRequest(
  rental: Pick<
    MachineRental,
    | 'paymentAmount'
    | 'paymentRequestedAt'
    | 'paymentDueAt'
    | 'cancellationDueAt'
  >,
): boolean {
  return Boolean(
    rental.paymentRequestedAt &&
      rental.paymentDueAt &&
      rental.cancellationDueAt &&
      rental.paymentAmount !== null &&
      rental.paymentAmount !== undefined,
  );
}

export function getRentalDisplayStatus(
  rental: Pick<
    MachineRental,
    | 'status'
    | 'paymentAmount'
    | 'paymentRequestedAt'
    | 'paymentDueAt'
    | 'cancellationDueAt'
  >,
  now = new Date(),
): RentalDisplayStatus {
  if (rental.status === 'PAYMENT_PENDING') {
    // Location confirmée sans demande de paiement : créée en interne, ou
    // antérieure au workflow de paiement. Son paiement est suivi à la main.
    if (!hasRentalPaymentRequest(rental)) {
      return 'UNPAID';
    }
    if (new Date(rental.paymentDueAt!).getTime() <= now.getTime()) {
      return 'OVERDUE';
    }
  }
  return rental.status;
}

export const RENTAL_STATUS_LABELS: Record<RentalDisplayStatus, string> = {
  PENDING_APPROVAL: 'À valider',
  UNPAID: 'Non payée',
  PAYMENT_PENDING: 'Paiement en attente',
  OVERDUE: 'En retard',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};
