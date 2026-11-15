# pivot-grid

Componente de **tabela dinâmica (pivot)** para Angular: linhas multi-nível,
colunas dinâmicas, múltiplos valores, agregação, totais, filtros, hierarquia de
datas, templates, virtualização e exportação CSV/XLSX.

- Angular **21 ou 22** (linha 2.x estável); Angular 18–20 na linha 1.x
- Sem dependências de runtime (além de `tslib`)
- Standalone component, `OnPush`, API baseada em signals
- Acessível (roles ARIA, teclado, expandir/colapsar, axe)
- Zoneless e SSR/hydration na linha 2.x
- Tema por CSS variables
- Licença **MIT**

## Instalação

```bash
npm install --save-exact pivot-grid@2.3.0
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

| Recurso | Situação |
|---|---|
| Linhas multi-nível e colunas dinâmicas | ✅ |
| Agregação `sum/avg/min/max/count/countDistinct` | ✅ |
| Múltiplos valores (`values[]`) | ✅ |
| Totais de linha/coluna/geral | ✅ |
| Expandir/colapsar com estado controlado | ✅ |
| Filtros por eixo + hierarquia de datas | ✅ |
| Templates de célula/cabeçalho | ✅ |
| Colunas redimensionáveis (`PivotState.columns`) | ✅ |
| Cabeçalho de linha em árvore (`rowHeaderLayout="tree"`) | ✅ |
| Tema completo por CSS variables | ✅ |
| Drill-down de célula (`cellDetails`) | ✅ |
| Virtualização (`virtualScroll`) | ✅ |
| Formatação condicional por medida auxiliar | ✅ |
| CSV e XLSX (sem dependência) | ✅ |
| Zoneless + SSR/hydration (2.x) | ✅ |

## Documentação

- [Especificação](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/SPECIFICATION.md)
- [API](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/API.md)
- [Engine](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/ENGINE.md)
- [Integração](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/INTEGRATION.md)
- [Migração 2.x](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/MIGRATION-2.md)
- [Compatibilidade](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/COMPATIBILITY.md)
- [Exemplos](https://github.com/LeonardoHessel/pivot-grid/blob/main/docs/examples/README.md)
- [Demo](https://leonardohessel.github.io/pivot-grid/)

## Licença

MIT © Leonardo Hessel

