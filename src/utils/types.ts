export interface MachineRental {
  id: string;
  machineRentedId: string;
  rentalDate: Date;
  returnDate: Date | null;
}

export type MachineRentalCreated = Omit<MachineRental, 'id'>;

export interface MachineRented {
  id: string;
  name: string;
  maintenance_type: 'BY_DAY' | 'BY_NB_RENTAL';
  nb_day_before_maintenance: number | null;
  nb_rental_before_maintenance: number | null;
  last_maintenance_date: Date | null;
  next_maintenance: Date | null;
  machineRentals: MachineRental[];
}

export type MachineRentedCreated = Omit<
  MachineRented,
  'id' | 'next_maintenance' | 'machineRentals'
>;

export type MachineRentedUpdatedData = Partial<MachineRentedCreated>;
