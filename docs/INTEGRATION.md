# Guia de integração

Adoção do `pivot-grid` em um app Angular. Escolha a linha conforme a versão:

| App | Linha | Instalação |
|---|---|---|
| Angular 21/22 | 2.x | `npm install --save-exact pivot-grid@2.4.2` |
| Angular 18/19/20 | 1.x | `npm install --save-exact pivot-grid@1.2.0` |

Campos de exemplo são genéricos; adapte aos nomes da sua API.

## 1. Componente mínimo

```ts
import { Component, viewChild } from '@angular/core';
import {
  PivotGridComponent,
  PivotConfig,
  PivotLabels,
} from 'pivot-grid';

@Component({
  selector: 'app-pivot',
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

    <button (click)="grid.exportCsv()">CSV</button>
    <button (click)="grid.exportExcel()">Excel</button>
  `,
})
export class PivotComponent {
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
    expand: 'Expandir',
    collapse: 'Recolher',
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
    defaultExpandDepth: 1,
    emptyText: '-',
    locale: 'pt-BR',
  };
}
```

## 2. Mapeamento típico (CDP × período)

| Config | Campo |
|---|---|
| `rows` | região → CDP principal → CDP |
| `columns` | ano → mês (ou `dateHierarchy`) |
| `values` | média ponderada (`aggregator: 'avg'` ou `'sum'`) |
| `auxiliaryValues` | `goalPercentage` (`avg`) |
| `conditionalRules[0].measure` | `goalPercentage` |
| regra | `<= 1`, cor de fundo, `applyToTotals: true` |
| `emptyText` / `labels.empty` | `-` |
| `height` | altura fixa (ex.: `1000px`) |
| `width` | `100%` |

## 3. Recursos opcionais

- **Filtros**: `PivotField.filterable` + `[filters]`/`(filtersChange)`.
- **Hierarquia de datas**: `PivotField.dateHierarchy`.
- **Templates**: `[cellTemplate]`/`[headerTemplate]`.
- **Virtualização**: `[virtualScroll]="true"` + `height`/`rowHeight`.
- **Colunas redimensionáveis**: `PivotState.columns` + `columnStateChange`.

## 4. Exportação

- `grid.exportCsv({ filename, mode: 'full' | 'visible' })`
- `grid.exportExcel({ filename, mode: 'full' | 'visible' })`

## 5. Gate de paridade

- [ ] matriz idêntica (cruzamentos e valores);
- [ ] totais de linha/coluna/geral conferem;
- [ ] regras condicionais nas células e nos totais;
- [ ] células vazias com `-`;
- [ ] rótulos pt-BR;
- [ ] CSV/XLSX abrem corretamente;
- [ ] layout, sticky e virtualização (se usados);
- [ ] zero erros de console.

## 6. Remoção da dependência antiga

Somente após o gate: remover imports/módulos e licença do pacote anterior,
`npm install`, build e smoke da tela.

## 7. Limitações conhecidas

- Exportação sempre inclui totais do escopo completo no modo `visible`.
- Virtualização usa altura fixa (`rowHeight`); linhas com conteúdo muito alto
  devem usar o modo normal.
- Tema por CSS variables (2.3) e tooltip de célula no hover (2.4).
- Reordenar/fixar colunas ficam para a próxima minor.




