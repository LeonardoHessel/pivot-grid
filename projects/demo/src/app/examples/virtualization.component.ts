import { Component } from '@angular/core';
import { PivotConfig, PivotData, PivotLabels, PivotGridComponent } from 'pivot-grid';

const TOTAL_ROWS = 50_000;

function buildLargeData(): PivotData {
  const rows: Record<string, unknown>[] = [];
  for (let index = 0; index < TOTAL_ROWS; index += 1) {
    rows.push({
      region: `R${index % 20}`,
      customer: `C${String(index).padStart(5, '0')}`,
      month: `2026-${String((index % 12) + 1).padStart(2, '0')}`,
      amount: (index * 37) % 1000,
    });
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
};

@Component({
  selector: 'app-virtualization',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <header class="demo-header">
      <div>
        <h1>Virtualização</h1>
        <p>
          50.000 linhas renderizadas com janela virtual (altura fixa de 480px).
          Role a lista: apenas as linhas visíveis vão para o DOM.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <pg-pivot-grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        height="480px"
        width="100%"
        [virtualScroll]="true"
        [rowHeight]="28"
        [virtualOverscan]="8"
      ></pg-pivot-grid>
    </section>
  `,
})
export class VirtualizationComponent {
  readonly data = buildLargeData();
  readonly labels = LABELS;
  readonly config: PivotConfig = {
    rows: [
      { field: 'region', caption: 'Região', width: 120 },
      { field: 'customer', caption: 'Cliente', width: 140 },
    ],
    columns: [{ field: 'month', caption: 'Mês' }],
    values: [{ field: 'amount', caption: 'Quantidade' }],
    showRowTotals: true,
    showGrandTotal: true,
    defaultExpandDepth: 1,
    emptyText: '-',
    locale: 'pt-BR',
  };
}
