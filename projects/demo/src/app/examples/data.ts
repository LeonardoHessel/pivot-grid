import { PivotConfig, PivotData, PivotLabels } from '@leonardohessel/pivot-grid';

const REGIONS = [
  { region: 'Norte', cities: ['Alfa', 'Bravo'] },
  { region: 'Sul', cities: ['Charlie', 'Delta'] },
];

const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

export const DEMO_LABELS: Partial<PivotLabels> = {
  grandTotal: 'Total geral',
  rowTotal: 'Total',
  columnTotal: 'Total',
  empty: '-',
  noData: 'Sem dados para exibir',
  loading: 'Carregando…',
  expand: 'Expandir',
  collapse: 'Recolher',
  export: 'Exportar',
};

export function buildDemoData(): PivotData {
  const rows: Record<string, unknown>[] = [];
  let seed = 7;
  for (const entry of REGIONS) {
    for (const city of entry.cities) {
      for (const month of MONTHS) {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        rows.push({
          region: entry.region,
          city,
          year: month.slice(0, 4),
          month,
          amount: 20 + (seed % 180),
          goal: 0.6 + ((seed % 90) / 100),
        });
      }
    }
  }
  return rows;
}

export function demoConfig(rowWidths?: number[]): PivotConfig {
  const widths = rowWidths ?? [160, 160];
  return {
    rows: [
      { field: 'region', caption: 'Região', width: widths[0] },
      { field: 'city', caption: 'Cidade', width: widths[1] },
    ],
    columns: [
      { field: 'year', caption: 'Ano' },
      { field: 'month', caption: 'Mês' },
    ],
    values: [{ field: 'amount', caption: 'Quantidade', aggregator: 'sum' }],
    auxiliaryValues: [{ field: 'goal', aggregator: 'avg' }],
    conditionalRules: [
      {
        measure: 'goal',
        operator: '<=',
        value: 1,
        style: { backgroundColor: '#dcfce7', color: '#166534' },
        applyToTotals: true,
      },
    ],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    defaultExpandDepth: 1,
    emptyText: '-',
    locale: 'pt-BR',
  };
}
