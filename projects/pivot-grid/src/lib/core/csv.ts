import { cellKey } from './build-pivot';
import { CsvExportOptions, PivotResult } from './types';

function escapeCsv(value: string, delimiter: string): string {
  let text = value ?? '';
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (text.includes(delimiter) || /["\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function valueCaption(value: { field: string; caption?: string }): string {
  return value.caption ?? value.field;
}

/** Serializes the full pivot matrix (leaves + totals) to CSV. */
export function toCsv(result: PivotResult, options: CsvExportOptions = {}): string {
  const delimiter = options.delimiter ?? ',';
  const values = result.config.values;
  if (values.length === 0) {
    return '';
  }

  const rowCaptions = result.config.rows.map((row) => row.caption ?? row.field);
  const columns = result.columns;
  const includeRowTotal = Boolean(result.config.showRowTotals);
  const includeColumnTotal = Boolean(result.config.showColumnTotals);

  const header = [
    ...rowCaptions,
    ...columns.flatMap((column) =>
      values.map((value) => [...column.path, valueCaption(value)].join(' / ')),
    ),
    ...(includeRowTotal ? values.map((value) => `Total - ${valueCaption(value)}`) : []),
  ];

  const lines: string[][] = [header];

  for (const row of result.rows) {
    const cells = columns.flatMap((column) =>
      values.map(
        (value) =>
          result.cells.get(cellKey(row.key, column.key, value.field))?.formatted ?? '',
      ),
    );
    const rowTotals = includeRowTotal
      ? values.map(
          (value) =>
            result.rowTotals.get(cellKey(row.key, '', value.field))?.formatted ?? '',
        )
      : [];
    lines.push([
      ...rowCaptions.map((_caption, index) => row.path[index] ?? ''),
      ...cells,
      ...rowTotals,
    ]);
  }

  if (includeColumnTotal) {
    lines.push([
      'Total',
      ...columns.flatMap((column) =>
        values.map(
          (value) =>
            result.columnTotals.get(cellKey('', column.key, value.field))?.formatted ?? '',
        ),
      ),
      ...(includeRowTotal
        ? values.map((value) => result.grandTotals.get(value.field)?.formatted ?? '')
        : []),
    ]);
  }

  const body = lines
    .map((line) => line.map((value) => escapeCsv(value, delimiter)).join(delimiter))
    .join('\r\n');

  return `${options.bom === false ? '' : '\uFEFF'}${body}`;
}
