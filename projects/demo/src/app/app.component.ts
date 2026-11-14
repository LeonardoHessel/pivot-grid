import { DecimalPipe } from '@angular/common';
import { Component, computed, viewChild } from '@angular/core';
import { PivotGridComponent, PivotConfig, PivotData, PivotLabels } from '@leonardohessel/pivot-grid';

const REGIONS = [
  { region: 'Norte', cities: ['Alfa', 'Bravo'] },
  { region: 'Sul', cities: ['Charlie', 'Delta'] },
];

const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

function buildData(): PivotData {
  const rows: Record<string, unknown>[] = [];
  let seed = 7;
  for (const entry of REGIONS) {
    for (const city of entry.cities) {
      for (const month of MONTHS) {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        const amount = 20 + (seed % 180);
        const goal = 0.6 + ((seed % 90) / 100);
        rows.push({
          region: entry.region,
          city,
          year: month.slice(0, 4),
          month,
          amount,
          goal,
        });
      }
    }
  }
  return rows;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PivotGridComponent, DecimalPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly title = 'pivot-grid demo';
  readonly grid = viewChild(PivotGridComponent);
  readonly data = buildData();

  readonly labels: Partial<PivotLabels> = {
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

  readonly config: PivotConfig = {
    rows: [
      { field: 'region', caption: 'Região' },
      { field: 'city', caption: 'Cidade' },
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

  readonly total = computed(() =>
    this.data.reduce((sum, row) => sum + Number(row['amount'] ?? 0), 0),
  );

  exportCsv(): void {
    this.grid()?.exportCsv({ filename: 'pivot-demo.csv' });
  }
}

