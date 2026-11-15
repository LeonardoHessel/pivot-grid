import { buildPivot, cellKey, PivotError } from './build-pivot';
import { toCsv } from './csv';
import { toXlsx } from './xlsx';
import { PivotConfig } from './types';

const data = [
  { region: 'Sul', city: 'A', month: '2026-01', amount: 100 },
  { region: 'Sul', city: 'A', month: '2026-02', amount: 50 },
  { region: 'Sul', city: 'B', month: '2026-01', amount: 25 },
  { region: 'Norte', city: 'A', month: '2026-01', amount: 30 },
  { region: 'Norte', city: 'A', month: '2026-01', amount: 20 },
];

function config(overrides: Partial<PivotConfig> = {}): PivotConfig {
  return {
    rows: [{ field: 'region', caption: 'Região' }],
    columns: [{ field: 'month', caption: 'Mês' }],
    values: [{ field: 'amount', caption: 'Total' }],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    locale: 'pt-BR',
    ...overrides,
  };
}

describe('buildPivot', () => {
  it('aggregates cells and totals with sum', () => {
    const result = buildPivot(data, config());

    expect(result.cells.get(cellKey('Sul', '2026-01', 'amount'))?.value).toBe(125);
    expect(result.cells.get(cellKey('Sul', '2026-02', 'amount'))?.value).toBe(50);
    expect(result.cells.get(cellKey('Norte', '2026-01', 'amount'))?.value).toBe(50);

    expect(result.rowTotals.get(cellKey('Sul', '', 'amount'))?.value).toBe(175);
    expect(result.rowTotals.get(cellKey('Norte', '', 'amount'))?.value).toBe(50);

    expect(result.columnTotals.get(cellKey('', '2026-01', 'amount'))?.value).toBe(175);
    expect(result.columnTotals.get(cellKey('', '2026-02', 'amount'))?.value).toBe(50);

    expect(result.grandTotals.get('amount')?.value).toBe(225);
    expect(result.diagnostics.length).toBe(0);
  });

  it('computes avg from raw records, never as an average of averages', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: 10 },
      { group: 'A', month: '2026-01', amount: 20 },
      { group: 'B', month: '2026-01', amount: 30 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'group' }],
      columns: [{ field: 'month' }],
      values: [{ field: 'amount', aggregator: 'avg' }],
    }));

    expect(result.cells.get(cellKey('A', '2026-01', 'amount'))?.value).toBe(15);
    expect(result.cells.get(cellKey('B', '2026-01', 'amount'))?.value).toBe(30);
    expect(result.columnTotals.get(cellKey('', '2026-01', 'amount'))?.value).toBe(20);
    expect(result.grandTotals.get('amount')?.value).toBe(20);
  });

  it('supports min, max, count and countDistinct', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: 5 },
      { group: 'A', month: '2026-01', amount: 9 },
      { group: 'A', month: '2026-01', amount: 5 },
    ];

    const min = buildPivot(rows, config({ values: [{ field: 'amount', aggregator: 'min' }] }));
    const max = buildPivot(rows, config({ values: [{ field: 'amount', aggregator: 'max' }] }));
    const count = buildPivot(rows, config({ values: [{ field: 'amount', aggregator: 'count' }] }));
    const distinct = buildPivot(rows, config({ values: [{ field: 'amount', aggregator: 'countDistinct' }] }));

    expect(min.grandTotals.get('amount')?.value).toBe(5);
    expect(max.grandTotals.get('amount')?.value).toBe(9);
    expect(count.grandTotals.get('amount')?.value).toBe(3);
    expect(distinct.grandTotals.get('amount')?.value).toBe(2);
  });

  it('builds multi-level rows with unique keys per path', () => {
    const result = buildPivot(data, config({
      rows: [{ field: 'region' }, { field: 'city' }],
      columns: [{ field: 'month' }],
    }));

    expect(result.rows.map((row) => row.caption)).toEqual(['A', 'A', 'B']);
    expect(result.rows.map((row) => row.key)).toEqual([
      'Norte\u001fA',
      'Sul\u001fA',
      'Sul\u001fB',
    ]);
    expect(result.cells.get(cellKey('Sul\u001fB', '2026-01', 'amount'))?.value).toBe(25);
  });

  it('sorts rows by aggregated value', () => {
    const asc = buildPivot(data, config({
      sort: { rows: { by: 'value', direction: 'asc' } },
    }));
    const desc = buildPivot(data, config({
      sort: { rows: { by: 'value', direction: 'desc' } },
    }));

    expect(asc.rows.map((row) => row.caption)).toEqual(['Norte', 'Sul']);
    expect(desc.rows.map((row) => row.caption)).toEqual(['Sul', 'Norte']);
  });

  it('renders empty cells with emptyText and keeps count semantics', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: 10 },
      { group: 'B', month: '2026-02', amount: 20 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'group' }],
      columns: [{ field: 'month' }],
      values: [{ field: 'amount', emptyText: '-' }],
    }));

    const empty = result.cells.get(cellKey('A', '2026-02', 'amount'));
    expect(empty?.value).toBeNull();
    expect(empty?.counts).toBe(0);
    expect(empty?.formatted).toBe('-');
  });

  it('distinguishes no records from records without valid numbers', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: null },
      { group: 'A', month: '2026-01', amount: 'abc' },
    ];
    const sum = buildPivot(rows, config({ rows: [{ field: 'group' }] })),
      avg = buildPivot(rows, config({ rows: [{ field: 'group' }], values: [{ field: 'amount', aggregator: 'avg' }] }));

    expect(sum.cells.get(cellKey('A', '2026-01', 'amount'))?.value).toBe(0);
    expect(avg.cells.get(cellKey('A', '2026-01', 'amount'))?.value).toBeNull();
    expect(sum.diagnostics.some((diagnostic) => diagnostic.code === 'non-numeric-value')).toBeTrue();
  });

  it('normalizes Date values to ISO day keys', () => {
    const result = buildPivot(
      [{ group: 'A', day: new Date('2026-01-15T12:00:00Z'), amount: 1 }],
      config({ rows: [{ field: 'group' }], columns: [{ field: 'day' }] }),
    );

    expect(result.columns[0].caption).toBe('2026-01-15');
  });

  it('reports missing fields once', () => {
    const result = buildPivot(
      [{ month: '2026-01', amount: 1 }, { month: '2026-02', amount: 2 }],
      config(),
    );

    const missing = result.diagnostics.filter((diagnostic) => diagnostic.code === 'missing-field');
    expect(missing.length).toBe(1);
    expect(missing[0].field).toBe('region');
  });

  it('aggregates every configured value field', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: 10, qty: 2 },
      { group: 'A', month: '2026-01', amount: 20, qty: 3 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'group' }],
      columns: [{ field: 'month' }],
      values: [
        { field: 'amount', caption: 'Valor' },
        { field: 'qty', caption: 'Qtd' },
      ],
      showRowTotals: true,
      showGrandTotal: true,
    }));

    expect(result.cells.get(cellKey('A', '2026-01', 'amount'))?.value).toBe(30);
    expect(result.cells.get(cellKey('A', '2026-01', 'qty'))?.value).toBe(5);
    expect(result.rowTotals.get(cellKey('A', '', 'qty'))?.value).toBe(5);
    expect(result.grandTotals.get('qty')?.value).toBe(5);
    expect(result.grandTotals.has('amount')).toBeTrue();
    expect(result.diagnostics.length).toBe(0);
  });

  it('applies conditional rules per measure', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: 10, qty: 5 },
      { group: 'B', month: '2026-01', amount: 90, qty: 1 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'group' }],
      columns: [{ field: 'month' }],
      values: [
        { field: 'amount', caption: 'Valor' },
        { field: 'qty', caption: 'Qtd' },
      ],
      conditionalRules: [
        { field: 'qty', operator: '>=', value: 5, className: 'qty-high', applyToTotals: true },
      ],
    }));

    expect(result.cells.get(cellKey('A', '2026-01', 'qty'))?.className).toBe('qty-high');
    expect(result.cells.get(cellKey('A', '2026-01', 'amount'))?.className).toBeUndefined();
    expect(result.cells.get(cellKey('B', '2026-01', 'qty'))?.className).toBeUndefined();
  });

  it('sorts rows by the measure selected in sort.field', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: 100, qty: 1 },
      { group: 'B', month: '2026-01', amount: 10, qty: 9 },
    ];
    const byAmount = buildPivot(rows, config({
      rows: [{ field: 'group' }],
      columns: [{ field: 'month' }],
      values: [{ field: 'amount' }, { field: 'qty' }],
      sort: { rows: { by: 'value', field: 'amount', direction: 'desc' } },
    }));
    const byQty = buildPivot(rows, config({
      rows: [{ field: 'group' }],
      columns: [{ field: 'month' }],
      values: [{ field: 'amount' }, { field: 'qty' }],
      sort: { rows: { by: 'value', field: 'qty', direction: 'desc' } },
    }));

    expect(byAmount.rows.map((node) => node.caption)).toEqual(['A', 'B']);
    expect(byQty.rows.map((node) => node.caption)).toEqual(['B', 'A']);
  });

  it('returns an empty result when values are missing', () => {
    const result = buildPivot(data, config({ values: [] }));

    expect(result.rows.length).toBe(0);
    expect(result.grandTotals.size).toBe(0);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === 'invalid-config')).toBeTrue();
  });

  it('applies the first matching conditional rule and skips totals by default', () => {
    const result = buildPivot(data, config({
      conditionalRules: [
        { operator: '>', value: 100, className: 'high' },
        { operator: '>', value: 10, className: 'low' },
      ],
    }));

    expect(result.cells.get(cellKey('Sul', '2026-01', 'amount'))?.className).toBe('high');
    expect(result.cells.get(cellKey('Sul', '2026-02', 'amount'))?.className).toBe('low');
    expect(result.grandTotals.get('amount')?.className).toBeUndefined();

    const withTotals = buildPivot(data, config({
      conditionalRules: [{ operator: '>', value: 0, className: 'all', applyToTotals: true }],
    }));
    expect(withTotals.grandTotals.get('amount')?.className).toBe('all');
  });

  it('formats values with Intl and locale', () => {
    const result = buildPivot(
      [{ group: 'A', month: '2026-01', amount: 1234.567 }],
      config({
        rows: [{ field: 'group' }],
        columns: [{ field: 'month' }],
        values: [{ field: 'amount', format: { minimumFractionDigits: 2, maximumFractionDigits: 2 } }],
      }),
    );

    expect(result.cells.get(cellKey('A', '2026-01', 'amount'))?.formatted)
      .toBe(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234.567));
  });

  it('is deterministic across runs', () => {
    const first = buildPivot(data, config());
    const second = buildPivot(data, config());

    expect(Array.from(first.cells.keys())).toEqual(Array.from(second.cells.keys()));
    expect(first.grandTotals.get('amount')?.value).toBe(second.grandTotals.get('amount')?.value);
  });

  it('throws PivotError in strict mode when diagnostics exist', () => {
    expect(() =>
      buildPivot(data, config({ strict: true, rows: [{ field: 'region' }, { field: 'region' }] })),
    ).toThrowError(PivotError);
  });

  it('exposes subtree cells for collapsed nodes', () => {
    const result = buildPivot(data, config({
      rows: [{ field: 'region' }, { field: 'city' }],
      columns: [{ field: 'month' }],
    }));

    const sul = result.rowTree.find((node) => node.caption === 'Sul');
    expect(sul).toBeTruthy();
    const cell = result.nodeCells.get(cellKey(sul!.key, '2026-01', 'amount'));
    expect(cell?.value).toBe(125);
    expect(result.rowTotals.get(cellKey(sul!.key, '', 'amount'))?.value).toBe(175);
  });

  it('aggregates auxiliary measures and evaluates rules against them', () => {
    const rows = [
      { group: 'A', month: '2026-01', amount: 100, goal: 0.8 },
      { group: 'A', month: '2026-01', amount: 100, goal: 0.6 },
      { group: 'B', month: '2026-01', amount: 50, goal: 1.4 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'group' }],
      columns: [{ field: 'month' }],
      values: [{ field: 'amount' }],
      auxiliaryValues: [{ field: 'goal', aggregator: 'avg' }],
      conditionalRules: [
        { measure: 'goal', operator: '<=', value: 1, className: 'good', applyToTotals: true },
      ],
    }));

    const cellA = result.cells.get(cellKey('A', '2026-01', 'amount'));
    expect(cellA?.value).toBe(200);
    expect(cellA?.auxiliary?.['goal']).toBe(0.7);
    expect(cellA?.className).toBe('good');

    const cellB = result.cells.get(cellKey('B', '2026-01', 'amount'));
    expect(cellB?.auxiliary?.['goal']).toBe(1.4);
    expect(cellB?.className).toBeUndefined();

    expect(result.grandTotals.get('amount')?.auxiliary?.['goal']).toBeCloseTo(0.9333, 3);
    expect(result.grandTotals.get('amount')?.className).toBe('good');
  });


  it('returns source records for cells and totals on demand', () => {
    const result = buildPivot(
      [
        { region: 'Sul', city: 'A', month: '2026-01', amount: 100 },
        { region: 'Sul', city: 'A', month: '2026-01', amount: 50 },
        { region: 'Norte', city: 'B', month: '2026-01', amount: 30 },
      ],
      config({
        rows: [
          { field: 'region' },
          { field: 'city' },
        ],
        columns: [{ field: 'month' }],
        values: [{ field: 'amount' }],
        showRowTotals: true,
      }),
    );

    const leaf = result.recordsForCell(['Sul', 'A'], ['2026-01']);
    expect(leaf.length).toBe(2);
    expect(leaf.reduce((sum, record) => sum + Number(record['amount']), 0)).toBe(150);

    const rowTotal = result.recordsForCell(['Sul', 'A'], []);
    expect(rowTotal.length).toBe(2);

    const columnTotal = result.recordsForCell([], ['2026-01']);
    expect(columnTotal.length).toBe(3);
  });

  it('expands a date hierarchy into multiple levels', () => {
    const rows = [
      { region: 'A', date: '2026-01-15', amount: 1 },
      { region: 'A', date: '2026-04-10', amount: 2 },
      { region: 'A', date: '2027-02-01', amount: 3 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'region' }],
      columns: [{ field: 'date', dateHierarchy: ['year', 'quarter', 'month'] }],
      values: [{ field: 'amount' }],
    }));

    expect(result.columnTree.map((node) => node.caption)).toEqual(['2026', '2027']);
    expect(result.columnTree[0].children.map((node) => node.caption)).toEqual(['Q1', 'Q2']);
    expect(result.columnTree[0].children[0].children.map((node) => node.caption)).toEqual(['01']);
    expect(result.columns.length).toBe(3);
  });

  it('filters records before aggregation', () => {
    const rows = [
      { region: 'A', month: '2026-01', amount: 10 },
      { region: 'B', month: '2026-01', amount: 90 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'region' }],
      columns: [{ field: 'month' }],
      values: [{ field: 'amount' }],
      filters: [{ field: 'region', values: ['A'] }],
    }));

    expect(result.rows.map((node) => node.caption)).toEqual(['A']);
    expect(result.grandTotals.get('amount')?.value).toBe(10);
  });
  it('exports only visible rows when mode is visible', () => {
    const result = buildPivot(data, config({
      rows: [{ field: 'region' }],
      columns: [{ field: 'month' }],
      values: [{ field: 'amount' }],
    }));
    const csv = toCsv(result, {
      mode: 'visible',
      rows: [{ key: 'Sul', path: ['Sul'], collapsed: true }],
    });

    expect(csv).toContain('Sul');
    expect(csv).not.toContain('Norte');
  });
  it('builds a minimal XLSX workbook (zip) with sheet data', () => {
    const result = buildPivot(data, config());
    const bytes = toXlsx(result);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
    const text = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    expect(text).toContain('xl/worksheets/sheet1.xml');
    expect(text).toContain('2026-01 / Total');
  });

  it('serializes CSV with header, totals and formula-injection guard', () => {
    const rows = [
      { group: '=SUM(A1)', month: '2026-01', amount: 10 },
      { group: 'B', month: '2026-02', amount: 20 },
    ];
    const result = buildPivot(rows, config({
      rows: [{ field: 'group', caption: 'Grupo' }],
      columns: [{ field: 'month', caption: 'Mes' }],
      values: [{ field: 'amount', caption: 'Total' }],
    }));
    const csv = toCsv(result);

    expect(csv.startsWith('\uFEFF')).toBeTrue();
    expect(csv).toContain('Grupo');
    expect(csv).toContain('2026-01 / Total');
    expect(csv).toContain("'=SUM(A1)");
    expect(csv.split('\r\n').length).toBeGreaterThan(2);
  });
});







