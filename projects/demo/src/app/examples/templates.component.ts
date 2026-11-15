import { Component } from '@angular/core';
import { PivotConfig, PivotData, PivotLabels, PivotGridComponent } from 'pivot-grid';

const MONTHS = [
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
];

function buildData(): PivotData {
  const rows: Record<string, unknown>[] = [];
  for (const region of ['Norte', 'Sul']) {
    for (const month of MONTHS) {
      rows.push({
        region,
        month,
        amount: 60 + ((region.length * 31 + month.length * 7) % 160),
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
};

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <header class="demo-header">
      <div>
        <h1>Templates de célula e cabeçalho</h1>
        <p>
          Células com destaque acima de 180 e cabeçalhos com marcador de eixo,
          usando <code>cellTemplate</code> e <code>headerTemplate</code>.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <pg-pivot-grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        [cellTemplate]="cellTpl"
        [headerTemplate]="headerTpl"
        height="420px"
        width="100%"
        density="compact"
      ></pg-pivot-grid>
    </section>

    <ng-template #cellTpl let-formatted="formatted" let-value="value" let-field="field">
      <span
        class="tpl-cell"
        [class.tpl-cell--high]="value !== null && value > 180"
        [attr.title]="field + ': ' + value"
      >
        {{ formatted }}
      </span>
    </ng-template>

    <ng-template #headerTpl let-label="label" let-axis="axis">
      <span class="tpl-header" [attr.data-axis]="axis">
        <span class="tpl-header-axis">{{ axis === 'row' ? 'L' : 'C' }}</span>
        {{ label }}
      </span>
    </ng-template>
  `,
})
export class TemplatesComponent {
  readonly data = buildData();
  readonly labels = LABELS;
  readonly config: PivotConfig = {
    rows: [{ field: 'region', caption: 'Região', width: 160 }],
    columns: [{ field: 'month', caption: 'Mês' }],
    values: [{ field: 'amount', caption: 'Quantidade' }],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    defaultExpandDepth: 1,
    emptyText: '-',
    locale: 'pt-BR',
  };
}
