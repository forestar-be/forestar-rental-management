export interface MachineRentalAddon {
  addonName: string;
  price: number;
  price_type: string;
  quantity: number;
}

export interface MachineRental {
  id: string;
  machineRentedId: string;
  variantId?: number | null;
  rentalDate: Date | null;
  returnDate: Date | null;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  clientMessage: string;
  clientAddress: string;
  clientPostal: string;
  clientCity: string;
  paid: boolean;
  guests: string[];
  with_shipping: boolean;
  depositToPay: boolean;
  to_validate: boolean;
  finalTermsPdfId?: string;
  addons?: MachineRentalAddon[];
}

export interface MachineRentalWithMachineRented extends MachineRental {
  machineRented: MachineRentedWithoutRental;
  variant?: { id: number; title: string } | null;
}

export type MachineRentalToCreate = Omit<
  MachineRental,
  'id' | 'machineRentedId'
>;

export interface MaintenanceHistory {
  id?: string;
  performedAt: Date;
  notes: string;
}

export interface MachineRentedAddon {
  addonName: string;
  price: number;
  category: string;
  price_type: string;
  quantity_enabled: boolean;
}

export interface MachineRentedCategory {
  categoryName: string;
}

export type VariantAddonState = 'FORCED' | 'OPTIONAL' | 'HIDDEN';

export interface MachineRentedVariantAddon {
  addonName: string;
  state: VariantAddonState;
  price: number;
  category: string;
  price_type: string;
}

export interface MachineRentedVariantImage {
  id: number;
  url: string;
  position: number;
}

export interface MachineRentedVariant {
  id: number;
  title: string;
  description: string | null;
  position: number;
  images: MachineRentedVariantImage[];
  addons: MachineRentedVariantAddon[];
  categories: MachineRentedCategory[];
}

export interface MachineRentedImage {
  id: number;
  url: string;
  position: number;
}

export interface MachineRented {
  id: string;
  name: string;
  description: string | null;
  maintenance_type: 'BY_DAY' | 'BY_NB_RENTAL';
  nb_day_before_maintenance: number | null;
  nb_rental_before_maintenance: number | null;
  last_maintenance_date: Date | null;
  next_maintenance: Date | null;
  machineRentals: MachineRental[];
  price_per_day: number;
  guests: string[];
  parts: MachineRentedPart[];
  addons: MachineRentedAddon[];
  categories: MachineRentedCategory[];
  maintenanceHistories: MaintenanceHistory[];
  deposit: number;
  forbiddenRentalDays: Date[];
  operatingHours: number | null;
  fuelLevel: number | null;
  lastMeasurementUpdate: Date | null;
  lastMeasurementUser: string | null;
  show_base_in_catalog: boolean;
  variants: MachineRentedVariant[];
  images: MachineRentedImage[];
}

export type MachineRentedWithoutRental = Omit<MachineRented, 'machineRentals'>;

export interface MachineRentedWithImage extends MachineRented {
  imageUrl: string;
}

export type MachineRentedSimpleWithImage = Omit<
  MachineRentedWithImage,
  'machineRentals' | 'maintenanceHistories' | 'parts'
>;

export type MachineRentedCreated = Omit<
  MachineRented,
  | 'id'
  | 'next_maintenance'
  | 'machineRentals'
  | 'last_maintenance_date'
  | 'maintenanceHistories'
  | 'parts'
  | 'addons'
  | 'categories'
  | 'forbiddenRentalDays'
  | 'variants'
  | 'images'
  | 'show_base_in_catalog'
>;

export type MachineRentedUpdatedData = Partial<MachineRented>;

export interface MachineRentedPart {
  partName: string;
}

export interface ConfigElement {
  key: string;
  value: string;
}
