import dayjs from 'dayjs';

export const calculateTotalPrice = (
  rental: {
    machineRented: {
      price_per_day: number;
    };
    rentalDate: Date | null;
    returnDate: Date | null;
    with_shipping: boolean;
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

    return (
      price_per_day * diffDays + (rental.with_shipping ? priceShipping : 0)
    );
  }

  return 0;
};
