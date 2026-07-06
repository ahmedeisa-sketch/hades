/** Formats a numeric string/number as a currency amount for the given code. */
export function formatCurrency(value: string | number, currency = 'AED'): string {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Formats a unit count with up to 6 decimal places. */
export function formatUnits(value: string | number): string {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/** Formats an ISO date string as a short local date, or a dash when null. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}
