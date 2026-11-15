import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PivotConfig,
  PivotData,
  PivotGridComponent,
  PivotLabels,
  PivotRowHeaderLayout,
} from 'pivot-grid';

const MONTHS = ['2026-01', '2026-02', '2026-03'];
const REGIONS = [
  { region: 'Norte', cities: ['Alfa', 'Bravo'] },
  { region: 'Sul', cities: ['Charlie', 'Delta'] },
];

function buildData(): PivotData {
  const rows: Record<string, unknown>[] = [];
  for (const entry of REGIONS) {
    for (const city of entry.cities) {
      for (const cdp of [`${city} 1`, `${city} 2`]) {
        for (const month of MONTHS) {
          rows.push({
            region: entry.region,
            city,
            cdp,
            month,
            amount: 20 + ((cdp.length * 13 + month.length * 7) % 90),
          });
        }
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
  resizeColumn: 'Redimensionar coluna',
  resetColumnWidth: 'Restaurar largura',
};

@Component({
  selector: 'app-row-header',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <header class="demo-header">
      <div>
        <h1>Layout do cabeçalho de linha</h1>
        <p>
          Compare <code>columns</code> (uma coluna por nível) com
          <code>tree</code> (uma coluna hierárquica indentada, como no pivot
          clássico). O toggle de cabeçalho da medida remove a linha
          “MÉDIA POD.” quando há uma única medida.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <div class="demo-toolbar">
        <button
          type="button"
          class="demo-toggle"
          [class.active]="layout() === 'columns'"
          (click)="setLayout('columns')"
        >
          Colunas por nível
        </button>
        <button
          type="button"
          class="demo-toggle"
          [class.active]="layout() === 'tree'"
          (click)="setLayout('tree')"
        >
          Árvore (clássico)
        </button>

        <label class="demo-check">
          <input
            type="checkbox"
            [checked]="showValueHeader()"
            (change)="toggleValueHeader()"
          />
          Mostrar cabeçalho da medida
        </label>
      </div>

      <pg-pivot-grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        [rowHeaderLayout]="layout()"
        [showValueHeader]="showValueHeader()"
        [indentSize]="18"
        [rowHeaderWidth]="220"
        height="520px"
        width="100%"
        density="compact"
        [stickyRowHeaders]="true"
      ></pg-pivot-grid>
    </section>
  `,
})
export class RowHeaderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly data = buildData();
  readonly labels = LABELS;
  readonly layout = signal<PivotRowHeaderLayout>('columns');
  readonly showValueHeader = signal(true);

  readonly config: PivotConfig = {
    rows: [
      { field: 'region', caption: 'Região', width: 140 },
      { field: 'city', caption: 'CDP Principal', width: 160 },
      { field: 'cdp', caption: 'CDP', width: 140 },
    ],
    columns: [{ field: 'month', caption: 'Mês' }],
    values: [{ field: 'amount', caption: 'MÉDIA POD.', aggregator: 'avg' }],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    defaultExpandDepth: 'all',
    emptyText: '-',
    locale: 'pt-BR',
  };

  constructor() {
    const query = this.route.snapshot.queryParamMap;
    this.layout.set(query.get('layout') === 'tree' ? 'tree' : 'columns');
    this.showValueHeader.set(query.get('valueHeader') !== 'false');
  }

  setLayout(layout: PivotRowHeaderLayout): void {
    this.layout.set(layout);
    this.syncQuery();
  }

  toggleValueHeader(): void {
    this.showValueHeader.update((value) => !value);
    this.syncQuery();
  }

  private syncQuery(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        layout: this.layout(),
        valueHeader: this.showValueHeader(),
      },
      replaceUrl: true,
    });
  }
}
