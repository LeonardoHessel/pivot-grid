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
  detailsRow: 'Linha',
  detailsColumn: 'Coluna',
  detailsClose: 'Fechar',
  aggregators: { avg: 'Média' },
  measureFormat: '{aggregation} de {caption}',
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
        <h1>Detalhes da célula (hover tooltip)</h1>
        <p>
          Passe o mouse sobre uma célula ou total para ver o tooltip com o
          resumo agregado (linha, coluna e medida), como no baseline. O modo
          diálogo continua opcional para clique/touch.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <div class="demo-toolbar">
        <button
          type="button"
          class="demo-toggle"
          [class.active]="!dialogMode()"
          (click)="useTooltip()"
        >
          Tooltip no hover
        </button>
        <button
          type="button"
          class="demo-toggle"
          [class.active]="dialogMode()"
          (click)="enableDialog()"
        >
          Diálogo no clique
        </button>
        <span class="demo-check">
          <code>cellDetails=true</code> · trigger
          {{ dialogMode() ? 'click' : 'hover' }} · mode
          {{ dialogMode() ? 'dialog' : 'tooltip' }}
        </span>
      </div>

      <pg-pivot-grid
        #grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        [cellDetails]="true"
        [cellDetailsMode]="dialogMode() ? 'dialog' : 'tooltip'"
        [cellDetailsTrigger]="dialogMode() ? 'click' : 'hover'"
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
  readonly dialogMode = signal(false);
  readonly lastOpened = signal('Passe o mouse sobre uma célula para ver o tooltip.');

  constructor() {
    afterNextRender(() => {
      this.grid()?.cellDetailsOpen.subscribe((context) => {
        this.lastOpened.set(
          context.records.length > 0
            ? `${context.formatted} · ${context.records.length} registro(s)`
            : `${context.formatted} · tooltip`,
        );
      });
      if (
        this.route.snapshot.queryParamMap.get('dialog') === '1' ||
        this.route.snapshot.queryParamMap.get('details') === '1'
      ) {
        this.enableDialog();
      }
    });
  }

  useTooltip(): void {
    this.dialogMode.set(false);
    this.grid()?.closeCellDetails();
    this.lastOpened.set('Passe o mouse sobre uma célula para ver o tooltip.');
  }

  enableDialog(): void {
    this.dialogMode.set(true);
    setTimeout(() => this.openSample());
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



