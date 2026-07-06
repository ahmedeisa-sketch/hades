type CsvValue = string | number | null | undefined;

/**
 * Serializes rows to RFC-4180-ish CSV. Fields containing quotes, commas or
 * newlines are wrapped in double quotes with embedded quotes doubled. Zero
 * dependencies — sufficient for exports; swap for a streaming library if
 * report sizes ever outgrow memory.
 */
export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const escape = (value: CsvValue): string => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ];
  return lines.join('\r\n');
}

/** ISO date (YYYY-MM-DD) or empty string for a nullable date. */
export function isoDate(date: Date | null | undefined): string {
  return date ? new Date(date).toISOString().slice(0, 10) : '';
}
