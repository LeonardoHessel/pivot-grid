import { buildPivot, cellKey, PivotError } from '../../../core/src/build-pivot';
import { PivotConfig } from '../../../core/src/types';

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

    expect(result.grandTotal?.value).toBe(225);
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
    expect(result.grandTotal?.value).toBe(20);
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

    expect(min.grandTotal?.value).toBe(5);
    expect(max.grandTotal?.value).toBe(9);
    expect(count.grandTotal?.value).toBe(3);
    expect(distinct.grandTotal?.value).toBe(2);
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

  it('uses only the first value and reports the unsupported configuration', () => {
    const result = buildPivot(data, config({
      values: [{ field: 'amount' }, { field: 'amount', caption: 'Outro' }],
    }));

    expect(result.diagnostics.some((diagnostic) => diagnostic.code === 'multiple-values-unsupported')).toBeTrue();
    expect(result.grandTotal?.field).toBe('amount');
  });

  it('returns an empty result when values are missing', () => {
    const result = buildPivot(data, config({ values: [] }));

    expect(result.rows.length).toBe(0);
    expect(result.grandTotal).toBeNull();
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
    expect(result.grandTotal?.className).toBeUndefined();

    const withTotals = buildPivot(data, config({
      conditionalRules: [{ operator: '>', value: 0, className: 'all', applyToTotals: true }],
    }));
    expect(withTotals.grandTotal?.className).toBe('all');
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
    expect(first.grandTotal?.value).toBe(second.grandTotal?.value);
  });

  it('throws PivotError in strict mode when diagnostics exist', () => {
    expect(() =>
      buildPivot(data, config({ strict: true, values: [{ field: 'amount' }, { field: 'amount' }] })),
    ).toThrowError(PivotError);
  });
});

