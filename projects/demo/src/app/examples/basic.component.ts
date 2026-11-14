import { Component, viewChild } from '@angular/core';
import { PivotGridComponent } from 'pivot-grid';
import { buildDemoData, DEMO_LABELS, demoConfig } from './data';

@Component({
  selector: 'app-basic',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <header class="demo-header">
      <div>
        <h1>Cenário básico</h1>
        <p>Dois níveis de linha, colunas ano/mês, totais e regra condicional.</p>
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
export class BasicComponent {
  readonly data = buildDemoData();
  readonly config = demoConfig();
  readonly labels = DEMO_LABELS;
  readonly grid = viewChild(PivotGridComponent);
}
