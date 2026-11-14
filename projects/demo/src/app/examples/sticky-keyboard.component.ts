import { Component, viewChild } from '@angular/core';
import { PivotGridComponent } from 'pivot-grid';
import { buildDemoData, DEMO_LABELS, demoConfig } from './data';

@Component({
  selector: 'app-sticky-keyboard',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <header class="demo-header">
      <div>
        <h1>Sticky + teclado</h1>
        <p>
          Role horizontalmente: as colunas de rótulos ficam fixas. Clique numa
          célula e use as setas, Home/End e PageUp/PageDown.
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
        height="420px"
        width="100%"
        density="compact"
      ></pg-pivot-grid>
    </section>
  `,
})
export class StickyKeyboardComponent {
  readonly data = buildDemoData();
  readonly config = demoConfig([120, 180]);
  readonly labels = DEMO_LABELS;
  readonly grid = viewChild(PivotGridComponent);
}
