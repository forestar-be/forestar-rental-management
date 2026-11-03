import { formatRentalDay, isRentalDay, rentalDays } from './rentalDates.util';
import { calculateTotalPrice } from './rental.util';

test('civil days, inclusive duration and prices do not depend on DST', () => {
  expect(isRentalDay('2026-02-30')).toBe(false);
  expect(isRentalDay('2024-02-29')).toBe(true);
  for (const start of ['2026-03-29', '2026-10-25', '2026-11-04']) {
    const end =
      start === '2026-03-29'
        ? '2026-03-30'
        : start === '2026-10-25'
          ? '2026-10-26'
          : '2026-11-05';
    expect(rentalDays(start, end)).toBe(2);
    expect(
      calculateTotalPrice(
        {
          machineRented: { price_per_day: 20 },
          rentalDate: start,
          returnDate: end,
          with_shipping: true,
          addons: [
            { price: 5, price_type: 'per_day', quantity: 2 },
            { price: 7, price_type: 'unit', quantity: 1 },
          ],
        },
        10,
      ),
    ).toBe(77);
  }
  expect(rentalDays('2026-11-04', null)).toBe(1);
  expect(rentalDays('2026-11-05', '2026-11-04')).toBe(0);
  expect(formatRentalDay('2026-11-04')).toBe('04/11/2026');
});
