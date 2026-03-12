import dayjs from 'dayjs';

export const calculateTotalPrice = (
  rental: {
    machineRented: {
      price_per_day: number;
    };
    rentalDate: Date | null;
    returnDate: Date | null;
    with_shipping: boolean;
    addons?: {
      price: number;
      price_type: string;
      quantity: number;
    }[];
  } | null,
  priceShipping: number,
) => {
  if (
    rental?.machineRented?.price_per_day &&
    rental?.rentalDate &&
    rental?.returnDate
  ) {
    const { price_per_day } = rental.machineRented;
    const startDate = dayjs(rental.rentalDate);
    const endDate = dayjs(rental.returnDate);
    const diffDays = endDate.diff(startDate, 'day') + 1; // +1 to include the first day

    const addonsTotal = (rental.addons || []).reduce((sum, addon) => {
      const multiplier = addon.price_type === 'per_day' ? diffDays : 1;
      return sum + addon.price * addon.quantity * multiplier;
    }, 0);

    return (
      price_per_day * diffDays +
      addonsTotal +
      (rental.with_shipping ? priceShipping : 0)
    );
  }

  return 0;
};
