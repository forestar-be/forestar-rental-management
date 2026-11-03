/** FORESTAR-237: rental bounds are inclusive civil days, never instants. */
export function isRentalDay(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.startsWith('0000')
  )
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function rentalDays(start: string, end: string | null): number {
  if (
    !isRentalDay(start) ||
    (end !== null && !isRentalDay(end)) ||
    (end !== null && end < start)
  )
    return 0;
  return (
    (Date.parse(`${end ?? start}T00:00:00Z`) -
      Date.parse(`${start}T00:00:00Z`)) /
      86400000 +
    1
  );
}
export function formatRentalDay(day: string | null): string {
  return isRentalDay(day)
    ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`
    : 'Non spécifié';
}
