import { cellKey } from './build-pivot';
import { CsvExportOptions, PivotResult } from './types';

function escapeCsv(value: string, delimiter: string): string {
  let text = value ?? '';
  // Prevent spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (text.includes(delimiter) || /["\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Serializes the full pivot matrix (leaves + totals) to CSV. */
export function toCsv(result: PivotResult, options: CsvExportOptions = {}): string {
  const delimiter = options.delimiter ?? ',';
  const valueField = result.config.values[0];
  if (!valueField) {
    return '';
  }
  const field = valueField.field;
  const valueCaption = valueField.caption ?? field;
  const rowCaptions = result.config.rows.map((row) => row.caption ?? row.field);
  const columns = result.columns;
  const includeRowTotal = Boolean(result.config.showRowTotals);
  const includeColumnTotal = Boolean(result.config.showColumnTotals);

  const header = [
    ...rowCaptions,
    ...columns.map((column) => [...column.path, valueCaption].join(' / ')),
    ...(includeRowTotal ? ['Total'] : []),
  ];

  const lines: string[][] = [header];

  for (const row of result.rows) {
    const values = columns.map(
      (column) =>
        result.cells.get(cellKey(row.key, column.key, field))?.formatted ?? '',
    );
    const rowTotal = includeRowTotal
      ? [result.rowTotals.get(cellKey(row.key, '', field))?.formatted ?? '']
      : [];
    lines.push([
      ...rowCaptions.map((_caption, index) => row.path[index] ?? ''),
      ...values,
      ...rowTotal,
    ]);
  }

  if (includeColumnTotal) {
    lines.push([
      'Total',
      ...columns.map(
        (column) =>
          result.columnTotals.get(cellKey('', column.key, field))?.formatted ?? '',
      ),
      ...(includeRowTotal ? [result.grandTotal?.formatted ?? ''] : []),
    ]);
  }

  const body = lines
    .map((line) => line.map((value) => escapeCsv(value, delimiter)).join(delimiter))
    .join('\r\n');

  return `${options.bom === false ? '' : '\uFEFF'}${body}`;
}
