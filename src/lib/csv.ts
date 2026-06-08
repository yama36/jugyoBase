export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsvRow(cells: Array<string | number | boolean | null | undefined>): string {
  return cells.map(escapeCsvCell).join(",");
}
