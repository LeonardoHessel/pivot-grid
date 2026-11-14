# Guia de integração

Guia curto para adotar o `@leonardohessel/pivot-grid` em um app Angular 18+.
Campos de exemplo são genéricos; adapte aos nomes da sua API.

## 1. Instalação

```bash
npm install --save-exact @leonardohessel/pivot-grid@0.2.0
```

Sempre com versão exata (sem URL de git).

## 2. Componente mínimo

```ts
import { Component, viewChild } from '@angular/core';
import {
  PivotGridComponent,
  PivotConfig,
  PivotLabels,
} from '@leonardohessel/pivot-grid';

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

## 3. Mapeamento típico da tela de Giro por CDP

| Config | Campo |
|---|---|
| `rows` | região → CDP principal → CDP |
| `columns` | ano → mês |
| `values` | média ponderada (`aggregator: 'avg'` ou `'sum'`) |
| `auxiliaryValues` | `goalPercentage` (`avg`) |
| `conditionalRules[0].measure` | `goalPercentage` |
| regra | `<= 1`, cor de fundo, `applyToTotals: true` |
| `emptyText` / `labels.empty` | `-` |
| `height` | altura fixa da tela (ex.: `1000px`) |
| `width` | `100%` |

## 4. Exportação

- `grid.exportCsv({ filename: 'giro.csv' })`
- `grid.exportExcel({ filename: 'giro.xlsx' })` — XLSX nativo (ZIP + XML)

Ambos exportam a matriz completa (folhas + totais). O XLSX abre com cabeçalho
em negrito e painel congelado.

## 5. Gate de paridade

- [ ] Matriz idêntica (mesmos cruzamentos e valores).
- [ ] Totais de linha, coluna e geral conferem.
- [ ] Regra sobre `goalPercentage` aplicada nas células e nos totais.
- [ ] Células vazias com `-`.
- [ ] Rótulos pt-BR.
- [ ] XLSX abre corretamente (cabeçalho e totais).
- [ ] Layout: 100% de largura, altura fixa, scroll interno, sem toolbar/field list.

## 6. Remoção da dependência antiga

Somente após o gate:

1. remover imports/módulos do pacote antigo;
2. remover o registro de licença;
3. remover as dependências do `package.json` e rodar `npm install`;
4. build + smoke da tela.

## 7. Limitações conhecidas

- Coluna de rótulos (row headers) não é fixa no scroll horizontal.
- Teclado parcial (expandir/colapsar por botão; navegação por setas ainda não).
- Exportação sempre da matriz completa (`exportMode` visible/full ainda não
  implementado).
