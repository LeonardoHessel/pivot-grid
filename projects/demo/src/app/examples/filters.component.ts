import { Component } from '@angular/core';
import { PivotConfig, PivotData, PivotLabels, PivotGridComponent } from 'pivot-grid';

const REGIONS = [
  { region: 'Norte', cities: ['Alfa', 'Bravo'] },
  { region: 'Sul', cities: ['Charlie', 'Delta'] },
];

function buildData(): PivotData {
  const rows: Record<string, unknown>[] = [];
  for (const entry of REGIONS) {
    for (const city of entry.cities) {
      for (let month = 1; month <= 12; month += 1) {
        rows.push({
          region: entry.region,
          city,
          orderDate: `2026-${String(month).padStart(2, '0')}-15`,
          amount: 50 + ((month * 17 + city.length * 3) % 200),
        });
      }
    }
  }
  return rows;
}

const LABELS: Partial<PivotLabels> = {
  grandTotal: 'Total geral',
  rowTotal: 'Total',
  columnTotal: 'Total',
  empty: '-',
  noData: 'Sem dados',
  expand: 'Expandir',
  collapse: 'Recolher',
  clearFilters: 'Limpar filtros',
};

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <header class="demo-header">
      <div>
        <h1>Filtros + hierarquia de datas</h1>
        <p>
          Filtre por Região/Cidade e navegue por Ano → Trimestre → Mês derivados
          automaticamente de <code>orderDate</code>.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <pg-pivot-grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        height="560px"
        width="100%"
        density="compact"
      ></pg-pivot-grid>
    </section>
  `,
})
export class FiltersComponent {
  readonly data = buildData();
  readonly labels = LABELS;
  readonly config: PivotConfig = {
    rows: [
      { field: 'region', caption: 'Região', filterable: true, width: 140 },
      { field: 'city', caption: 'Cidade', filterable: true, width: 140 },
    ],
    columns: [
      {
        field: 'orderDate',
        caption: 'Data',
        dateHierarchy: ['year', 'quarter', 'month'],
      },
    ],
    values: [{ field: 'amount', caption: 'Quantidade' }],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    defaultExpandDepth: 1,
    emptyText: '-',
    locale: 'pt-BR',
  };
}
