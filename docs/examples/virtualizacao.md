# Virtualização

Demonstra `virtualScroll` com 50.000 linhas:

- apenas a janela visível de linhas é renderizada;
- cabeçalho de colunas e colunas de rótulos continuam **sticky**;
- `rowHeight` define a altura fixa usada no cálculo da janela;
- `virtualOverscan` adiciona linhas extras acima/abaixo para suavizar o scroll.

## Configuração

```ts
import { PivotConfig } from 'pivot-grid';

export const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região', width: 120 },
    { field: 'customer', caption: 'Cliente', width: 140 },
  ],
  columns: [{ field: 'month', caption: 'Mês' }],
  values: [{ field: 'amount', caption: 'Quantidade' }],
  showRowTotals: true,
  showGrandTotal: true,
  defaultExpandDepth: 1,
  emptyText: '-',
  locale: 'pt-BR',
};
```

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  height="480px"
  width="100%"
  [virtualScroll]="true"
  [rowHeight]="28"
  [virtualOverscan]="8">
</pg-pivot-grid>
```

## Observações

- Em modo virtual, as colunas de rótulos não usam `rowspan` (cada linha mostra
  seu caminho), preservando o alinhamento e o sticky.
- `height` em pixels é usado diretamente como viewport; `%` depende da medição
  do container via `ResizeObserver`.

## Demo

Rota: [`/virtualizacao`](https://leonardohessel.github.io/pivot-grid/virtualizacao)
