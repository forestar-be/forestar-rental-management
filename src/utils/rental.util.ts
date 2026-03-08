import dayjs from 'dayjs';

export const calculateTotalPrice = (
  rental: {
    machineRented: {
      price_per_day: number;
    };
    rentalDate: Date | null;
    returnDate: Date | null;
    with_shipping: boolean;
    accessories?: { accessoryName: string; price_per_day: number }[];
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

    const accessoriesPricePerDay = (rental.accessories || []).reduce(
      (sum, a) => sum + a.price_per_day,
      0,
    );

    return (
      (price_per_day + accessoriesPricePerDay) * diffDays +
      (rental.with_shipping ? priceShipping : 0)
    );
  }

  return 0;
};
