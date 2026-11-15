import { JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { PivotConfig, PivotData, PivotLabels, PivotState, PivotGridComponent } from 'pivot-grid';

const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

function buildData(): PivotData {
  const rows: Record<string, unknown>[] = [];
  for (const region of ['Norte', 'Sul']) {
    for (const month of MONTHS) {
      rows.push({
        region,
        month,
        amount: 50 + ((region.length * 29 + month.length * 11) % 180),
      });
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
  selector: 'app-columns',
  standalone: true,
  imports: [PivotGridComponent, JsonPipe],
  template: `
    <header class="demo-header">
      <div>
        <h1>Colunas redimensionáveis</h1>
        <p>
          Arraste a alça no cabeçalho, use as setas com foco na alça ou dê duplo
          clique para restaurar. As larguras ficam em <code>PivotState.columns</code>.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <pg-pivot-grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        [state]="state()"
        [minColumnWidth]="70"
        [maxColumnWidth]="420"
        height="420px"
        width="100%"
        density="compact"
        (columnStateChange)="onColumnState($event)"
      ></pg-pivot-grid>
    </section>

    <pre class="demo-json">{{ widths() | json }}</pre>
  `,
})
export class ColumnsComponent {
  readonly data = buildData();
  readonly labels = LABELS;
  readonly widths = signal<Record<string, number>>({});
  readonly state = computed<PivotState>(() => ({
    expanded: {},
    columns: this.widths(),
  }));

  readonly config: PivotConfig = {
    rows: [{ field: 'region', caption: 'Região', width: 160 }],
    columns: [{ field: 'month', caption: 'Mês' }],
    values: [{ field: 'amount', caption: 'Quantidade' }],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    emptyText: '-',
    locale: 'pt-BR',
  };

  onColumnState(widths: Record<string, number>): void {
    this.widths.set(widths);
  }
}

