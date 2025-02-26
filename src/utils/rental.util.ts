export const calculateTotalPrice = (
  rental: {
    machineRented: {
      price_per_day: number;
    };
    rentalDate: Date | null;
    returnDate: Date | null;
  } | null,
) => {
  if (
    rental?.machineRented?.price_per_day &&
    rental?.rentalDate &&
    rental?.returnDate
  ) {
    const { price_per_day } = rental.machineRented;
    return (
      (price_per_day *
        (new Date(rental.returnDate).getTime() -
          new Date(rental.rentalDate).getTime())) /
      (1000 * 60 * 60 * 24)
    );
  }

  return 0;
};
