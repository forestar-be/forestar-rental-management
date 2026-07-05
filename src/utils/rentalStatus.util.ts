import { MachineRental } from './types';

export type RentalDisplayStatus =
  | 'PENDING_APPROVAL'
  | 'PAYMENT_PENDING'
  | 'OVERDUE'
  | 'PAID'
  | 'CANCELLED';

export function getRentalDisplayStatus(
  rental: Pick<MachineRental, 'status' | 'paymentDueAt'>,
  now = new Date(),
): RentalDisplayStatus {
  if (
    rental.status === 'PAYMENT_PENDING' &&
    rental.paymentDueAt &&
    new Date(rental.paymentDueAt).getTime() <= now.getTime()
  ) {
    return 'OVERDUE';
  }
  return rental.status;
}

export const RENTAL_STATUS_LABELS: Record<RentalDisplayStatus, string> = {
  PENDING_APPROVAL: 'À valider',
  PAYMENT_PENDING: 'Paiement en attente',
  OVERDUE: 'En retard',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};
