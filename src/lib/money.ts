
export const toCents = (usd: number) => Math.round(Number(usd) * 100);

export const centsToUsd = (cents: number) => (cents / 100).toFixed(2);

// $22.00 between 3 people → [734, 733, 733] cents. Always adds up exactly.
export function splitCents(totalCents: number, people: number): number[] {
  const base = Math.floor(totalCents / people);
  const extra = totalCents % people;
  return Array.from({ length: people }, (_, i) => base + (i < extra ? 1 : 0));
}
