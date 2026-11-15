import { writeFileSync } from 'node:fs';
import path from 'node:path';

const consumer = path.resolve(process.argv[2] ?? 'consumer');
const file = path.join(consumer, 'src', 'app', 'app.component.ts');

const source = `import { Component } from '@angular/core';
import { PivotGridComponent, PivotConfig } from 'pivot-grid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PivotGridComponent],
  template: \`
    <pg-pivot-grid
      [data]="rows"
      [config]="config"
      height="320px"
      width="100%"
      density="compact">
    </pg-pivot-grid>
  \`,
})
export class AppComponent {
  readonly rows = [
    { region: 'Sul', city: 'A', month: '2026-01', amount: 100 },
    { region: 'Sul', city: 'B', month: '2026-02', amount: 50 },
    { region: 'Norte', city: 'C', month: '2026-01', amount: 30 },
  ];

  readonly config: PivotConfig = {
    rows: [
      { field: 'region', caption: 'Região' },
      { field: 'city', caption: 'Cidade' },
    ],
    columns: [{ field: 'month', caption: 'Mês' }],
    values: [{ field: 'amount', caption: 'Total' }],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    defaultExpandDepth: 'all',
    locale: 'pt-BR',
  };
}
`;

writeFileSync(file, source);
console.log(`compat consumer written: ${path.relative(process.cwd(), file)}`);
