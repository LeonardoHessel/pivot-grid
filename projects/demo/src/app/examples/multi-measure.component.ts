import { Component, viewChild } from '@angular/core';
import { PivotGridComponent, PivotConfig } from 'pivot-grid';
import { buildDemoData, DEMO_LABELS, demoConfig } from './data';

@Component({
  selector: 'app-multi-measure',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <header class="demo-header">
      <div>
        <h1>Multi-medida</h1>
        <p>
          Duas medidas por célula: quantidade (soma) e média ponderada, com a
          medida como nível mais interno do cabeçalho.
        </p>
      </div>
      <div class="demo-actions">
        <button type="button" class="demo-action" (click)="grid()?.exportCsv()">CSV</button>
        <button type="button" class="demo-action demo-action--secondary" (click)="grid()?.exportExcel()">
          Excel
        </button>
      </div>
    </header>

    <section class="demo-card">
      <pg-pivot-grid
        [data]="data"
        [config]="config"
        [labels]="labels"
        height="600px"
        width="100%"
        density="compact"
      ></pg-pivot-grid>
    </section>
  `,
})
export class MultiMeasureComponent {
  readonly data = buildDemoData();
  readonly labels = DEMO_LABELS;
  readonly config: PivotConfig = {
    ...demoConfig(),
    values: [
      { field: 'amount', caption: 'Quantidade', aggregator: 'sum' },
      {
        field: 'goal',
        caption: 'Média Pod.',
        aggregator: 'avg',
        format: { maximumFractionDigits: 2 },
      },
    ],
  };
  readonly grid = viewChild(PivotGridComponent);
}
