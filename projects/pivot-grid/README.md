# pivot-grid

Componente de **tabela dinâmica (pivot)** para Angular: linhas multi-nível,
colunas dinâmicas, agregação, totais, formatação condicional, exportação CSV e
Excel.

- Angular **18, 19 ou 20**
- Sem dependências de runtime (além de `tslib`)
- Standalone component, `OnPush`, API baseada em signals
- Acessível (roles ARIA, `aria-sort`, expandir/colapsar via botão)
- Tema por CSS variables
- Licença **MIT**

## Instalação

```bash
npm install --save-exact pivot-grid@next
```

## Uso

```ts
import { Component, viewChild } from '@angular/core';
import {
  PivotGridComponent,
  PivotConfig,
  PivotLabels,
} from 'pivot-grid';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <pg-pivot-grid
      #grid
      [data]="rows"
      [config]="config"
      [labels]="labels"
      height="600px"
      width="100%">
    </pg-pivot-grid>

    <button type="button" (click)="grid.exportCsv()">CSV</button>
    <button type="button" (click)="grid.exportExcel()">Excel</button>
  `,
})
export class ReportComponent {
  readonly rows = [
    { region: 'Norte', city: 'Alfa', year: '2026', month: '2026-01', amount: 120, goal: 0.8 },
    { region: 'Sul', city: 'Beta', year: '2026', month: '2026-02', amount: 80, goal: 1.2 },
  ];

  readonly labels: Partial<PivotLabels> = {
    grandTotal: 'Total geral',
    rowTotal: 'Total',
    columnTotal: 'Total',
    empty: '-',
    noData: 'Sem dados',
  };

  readonly config: PivotConfig = {
    rows: [
      { field: 'region', caption: 'Região' },
      { field: 'city', caption: 'Cidade' },
    ],
    columns: [
      { field: 'year', caption: 'Ano' },
      { field: 'month', caption: 'Mês' },
    ],
    values: [{ field: 'amount', caption: 'Quantidade', aggregator: 'sum' }],
    auxiliaryValues: [{ field: 'goal', aggregator: 'avg' }],
    conditionalRules: [
      {
        measure: 'goal',
        operator: '<=',
        value: 1,
        style: { backgroundColor: '#dcfce7', color: '#166534' },
        applyToTotals: true,
      },
    ],
    showRowTotals: true,
    showColumnTotals: true,
    showGrandTotal: true,
    emptyText: '-',
    locale: 'pt-BR',
  };
}
```

## Recursos

| Recurso | Status |
|---|---|
| Linhas multi-nível e colunas dinâmicas | ✅ |
| Agregação `sum/avg/min/max/count/countDistinct` | ✅ |
| Totais de linha/coluna/geral | ✅ |
| Expandir/colapsar com estado controlado | ✅ |
| Formatação condicional por medida auxiliar | ✅ |
| CSV e XLSX (sem dependência) | ✅ |
| Virtualização e múltiplos valores | ⏳ v1.1 |

## Documentação

- [Especificação](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/SPECIFICATION.md)
- [API](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/API.md)
- [Engine](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/ENGINE.md)
- [Guia de integração](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/INTEGRATION.md)
- [Exemplos](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/examples/README.md)
- [Demo](https://leonardohessel.github.io/pivot-grid/)

## Licença

MIT © Leonardo Hessel



