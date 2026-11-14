# Multi-medida

Demonstra `values: PivotValueField[]` com mais de uma medida:

- cada medida vira uma coluna dentro de cada folha do eixo de colunas;
- com uma única medida, o layout permanece idêntico ao anterior;
- regras condicionais podem mirar uma medida específica via `rule.field`
  (valor principal) ou `rule.measure` (medida auxiliar);
- CSV/XLSX exportam uma coluna por medida.

## Configuração

```ts
import { PivotConfig } from 'pivot-grid';

export const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região' },
    { field: 'city', caption: 'Cidade' },
  ],
  columns: [
    { field: 'year', caption: 'Ano' },
    { field: 'month', caption: 'Mês' },
  ],
  values: [
    { field: 'amount', caption: 'Quantidade', aggregator: 'sum' },
    {
      field: 'goal',
      caption: 'Média Pod.',
      aggregator: 'avg',
      format: { maximumFractionDigits: 2 },
    },
  ],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  emptyText: '-',
  locale: 'pt-BR',
};
```

## Regras por medida

```ts
conditionalRules: [
  { field: 'amount', operator: '>', value: 1000, className: 'high-volume' },
  { field: 'goal', operator: '<=', value: 1, className: 'on-target', applyToTotals: true },
]
```

## Demo

Rota: [`/multi-medida`](https://leonardohessel.github.io/pivot-grid/multi-medida)
