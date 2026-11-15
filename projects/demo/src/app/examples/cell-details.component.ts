import {
  Component,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  PivotCell,
  PivotConfig,
  PivotData,
  PivotGridComponent,
  PivotLabels,
} from 'pivot-grid';

const data: PivotData = [
  { region: 'Norte', city: 'Alfa', month: '2026-01', amount: 57 },
  { region: 'Norte', city: 'Alfa', month: '2026-02', amount: 64 },
  { region: 'Norte', city: 'Bravo', month: '2026-01', amount: 70 },
  { region: 'Sul', city: 'Charlie', month: '2026-01', amount: 96 },
  { region: 'Sul', city: 'Charlie', month: '2026-02', amount: 88 },
  { region: 'Sul', city: 'Delta', month: '2026-02', amount: 70 },
];

const labels: Partial<PivotLabels> = {
  detailsTitle: 'Detalhes da célula',
  detailsClose: 'Fechar',
  detailsEmpty: 'Nenhum registro para esta célula.',
  grandTotal: 'Total geral',
  rowTotal: 'Total',
  columnTotal: 'Total',
};

const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região' },
    { field: 'city', caption: 'CDP Principal' },
  ],
  columns: [{ field: 'month', caption: 'Mês' }],
  values: [{ field: 'amount', caption: 'MÉDIA POD.', aggregator: 'avg' }],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  defaultExpandDepth: 'all',
  locale: 'pt-BR',
};

@Component({
  selector: 'app-cell-details',
  standalone: true,
  imports: [PivotGridComponent, JsonPipe],
  template: `
    <header class="demo-header">
      <div>
        <h1>Detalhes da célula (drill-down)</h1>
        <p>
          Clique em uma célula ou total para ver os registros de origem e o
          resumo agregado. O diálogo prende o foco, fecha com <kbd>Esc</kbd> e
          devolve o foco ao gatilho.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <div class="demo-toolbar">
        <button type="button" class="demo-toggle active" (click)="openSample()">
          Abrir detalhes de um total
        </button>
        <span class="demo-check">
          <code>cellDetails=true</code> · colunas: região, cidade, mês, valor
        </span>
      </div>

      <pg-pivot-grid
        #grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        [cellDetails]="true"
        [detailsColumns]="detailsColumns"
        height="420px"
        width="100%"
        density="compact"
      ></pg-pivot-grid>
    </section>

    <pre class="demo-json">{{ lastOpened() | json }}</pre>
  `,
})
export class CellDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly grid = viewChild(PivotGridComponent);

  readonly data = data;
  readonly config = config;
  readonly labels = labels;
  readonly detailsColumns = ['region', 'city', 'month', 'amount'];
  readonly lastOpened = signal('Clique em uma célula para abrir o diálogo.');

  constructor() {
    afterNextRender(() => {
      this.grid()?.cellDetailsOpen.subscribe((context) => {
        this.lastOpened.set(
          `${context.formatted} · ${context.records.length} registro(s)`,
        );
      });
      if (this.route.snapshot.queryParamMap.get('details') === '1') {
        setTimeout(() => this.openSample());
      }
    });
  }

  openSample(): void {
    const grid = this.grid();
    if (!grid) {
      return;
    }
    const totals = Array.from(grid.result().rowTotals.values());
    const cell: PivotCell | undefined =
      totals.find((candidate) => candidate.rowPath.length === 2 && candidate.counts > 1) ??
      totals.find((candidate) => candidate.counts > 1) ??
      totals[0];
    if (cell) {
      grid.openCellDetails(cell, null);
      this.lastOpened.set(`${cell.formatted} · ${cell.counts} registro(s)`);
    }
  }
}

