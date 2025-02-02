export interface MachineRental {
  id: string;
  machineRentedId: string;
  rentalDate: Date | null;
  returnDate: Date | null;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientPostal: string;
  clientCity: string;
  paid: boolean;
  guests: string[];
}

export interface MachineRentalWithMachineRented extends MachineRental {
  machineRented: MachineRentedWithoutRental;
}

export type MachineRentalToCreate = Omit<
  MachineRental,
  'id' | 'machineRentedId' | 'paid'
>;

export interface MachineRented {
  id: string;
  name: string;
  maintenance_type: 'BY_DAY' | 'BY_NB_RENTAL';
  nb_day_before_maintenance: number | null;
  nb_rental_before_maintenance: number | null;
  last_maintenance_date: Date | null;
  next_maintenance: Date | null;
  machineRentals: MachineRental[];
  price_per_day: number;
  guests: string[];
}

export type MachineRentedWithoutRental = Omit<MachineRented, 'machineRentals'>;

export interface MachineRentedWithImage extends MachineRented {
  imageUrl: string;
}

export type MachineRentedCreated = Omit<
  MachineRented,
  'id' | 'next_maintenance' | 'machineRentals'
>;

export type MachineRentedUpdatedData = Partial<MachineRentedCreated>;
