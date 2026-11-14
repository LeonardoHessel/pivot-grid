import { cellKey } from './build-pivot';
import { PivotResult, XlsxExportOptions } from './types';

/* ----------------------------------------------------------------------------
 * Minimal ZIP writer (STORE, no compression) — enough for a valid XLSX.
 * -------------------------------------------------------------------------- */

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

class ByteWriter {
  private readonly chunks: Uint8Array[] = [];
  private length = 0;

  get size(): number {
    return this.length;
  }

  bytes(data: Uint8Array): void {
    this.chunks.push(data);
    this.length += data.length;
  }

  u16(value: number): void {
    this.bytes(new Uint8Array([value & 0xff, (value >>> 8) & 0xff]));
  }

  u32(value: number): void {
    this.bytes(
      new Uint8Array([
        value & 0xff,
        (value >>> 8) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 24) & 0xff,
      ]),
    );
  }

  ascii(text: string): void {
    this.bytes(Uint8Array.from(text, (char) => char.charCodeAt(0)));
  }

  toUint8Array(): Uint8Array {
    const output = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }
}

function createZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const central = new ByteWriter();
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const local = new ByteWriter();
    local.u32(0x04034b50);
    local.u16(20);
    local.u16(0x0800); // UTF-8
    local.u16(0); // store
    local.u16(0);
    local.u16(0);
    local.u32(crc);
    local.u32(entry.data.length);
    local.u32(entry.data.length);
    local.u16(name.length);
    local.u16(0);
    local.bytes(name);
    local.bytes(entry.data);
    const localBytes = local.toUint8Array();
    locals.push(localBytes);

    central.u32(0x02014b50);
    central.u16(20);
    central.u16(20);
    central.u16(0x0800);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u32(crc);
    central.u32(entry.data.length);
    central.u32(entry.data.length);
    central.u16(name.length);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u32(0);
    central.u32(offset);
    central.bytes(name);

    offset += localBytes.length;
  }

  const centralBytes = central.toUint8Array();
  const end = new ByteWriter();
  end.u32(0x06054b50);
  end.u16(0);
  end.u16(0);
  end.u16(entries.length);
  end.u16(entries.length);
  end.u32(centralBytes.length);
  end.u32(offset);
  end.u16(0);

  const total = new ByteWriter();
  for (const local of locals) {
    total.bytes(local);
  }
  total.bytes(centralBytes);
  total.bytes(end.toUint8Array());
  return total.toUint8Array();
}

/* ----------------------------------------------------------------------------
 * Minimal XLSX (inline strings + one stylesheet)
 * -------------------------------------------------------------------------- */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnName(index: number): string {
  let name = '';
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function buildTableRows(
  result: PivotResult,
  options: XlsxExportOptions,
): (string | number | null)[][] {
  const includeTotals = options.includeTotals !== false;
  const values = result.config.values;
  if (values.length === 0) {
    return [];
  }
  const rows: (string | number | null)[][] = [];
  const rowCaptions = result.config.rows.map((row) => row.caption ?? row.field);
  const columns = result.columns;
  const includeRowTotal = Boolean(result.config.showRowTotals);
  const includeColumnTotal = includeTotals && Boolean(result.config.showColumnTotals);

  const caption = (value: { field: string; caption?: string }): string =>
    value.caption ?? value.field;

  rows.push([
    ...rowCaptions,
    ...columns.flatMap((column) =>
      values.map((value) => [...column.path, caption(value)].join(' / ')),
    ),
    ...(includeRowTotal
      ? values.map((value) => `Total - ${caption(value)}`)
      : []),
  ]);

  const visibleRows =
    options.mode === 'visible' && options.rows
      ? options.rows
      : result.rows.map((row) => ({ key: row.key, path: row.path, collapsed: false }));

  for (const row of visibleRows) {
    rows.push([
      ...rowCaptions.map((_caption, index) => row.path[index] ?? ''),
      ...columns.flatMap((column) =>
        values.map((value) => {
          const key = cellKey(row.key, column.key, value.field);
          const cell = row.collapsed
            ? result.nodeCells.get(key)
            : result.cells.get(key);
          return cell?.value ?? null;
        }),
      ),
      ...(includeRowTotal
        ? values.map(
            (value) =>
              result.rowTotals.get(cellKey(row.key, '', value.field))?.value ?? null,
          )
        : []),
    ]);
  }

  if (includeColumnTotal) {
    rows.push([
      'Total',
      ...columns.flatMap((column) =>
        values.map(
          (value) =>
            result.columnTotals.get(cellKey('', column.key, value.field))?.value ?? null,
        ),
      ),
      ...(includeRowTotal
        ? values.map((value) => result.grandTotals.get(value.field)?.value ?? null)
        : []),
    ]);
  }

  return rows;
}
function sheetXml(rows: (string | number | null)[][]): string {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
          if (typeof value === 'number' && Number.isFinite(value)) {
            return `<c r="${reference}"><v>${value}</v></c>`;
          }
          if (value === null || value === undefined || value === '') {
            return `<c r="${reference}"${rowIndex === 0 ? ' s="1"' : ''}/>`;
          }
          const style = rowIndex === 0 ? ' s="1"' : '';
          return `<c r="${reference}"${style} t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${body}</sheetData></worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf xfId="0"/><xf fontId="1" xfId="0" applyFont="1"/></cellXfs></styleSheet>`;

function workbookXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Pivot" sheetId="1" r:id="rId1"/></sheets></workbook>`;
}

/** Builds a minimal XLSX workbook (no external dependencies). */
export function toXlsx(
  result: PivotResult,
  options: XlsxExportOptions = {},
): Uint8Array {
  const rows = buildTableRows(result, options);
  const encoder = new TextEncoder();
  return createZip([
    { name: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES) },
    { name: '_rels/.rels', data: encoder.encode(ROOT_RELS) },
    { name: 'xl/workbook.xml', data: encoder.encode(workbookXml()) },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: encoder.encode(WORKBOOK_RELS),
    },
    { name: 'xl/styles.xml', data: encoder.encode(STYLES) },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: encoder.encode(sheetXml(rows)),
    },
  ]);
}


