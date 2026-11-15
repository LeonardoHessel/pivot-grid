# Filtros + hierarquia de datas

Funcionalidades aditivas da 1.1:

- **filtros por eixo**: campos marcados com `filterable: true` aparecem na barra
  de filtros; a seleção é aplicada antes da agregação e pode ser controlada via
  `[filters]` / `(filtersChange)`;
- **hierarquia de datas**: um campo de data vira vários níveis com
  `dateHierarchy` (ano → trimestre → mês → dia).

## Configuração

```ts
import { PivotConfig } from 'pivot-grid';

export const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região', filterable: true },
    { field: 'city', caption: 'Cidade', filterable: true },
  ],
  columns: [
    {
      field: 'orderDate',
      caption: 'Data',
      dateHierarchy: ['year', 'quarter', 'month'],
    },
  ],
  values: [{ field: 'amount', caption: 'Quantidade' }],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  defaultExpandDepth: 1,
  emptyText: '-',
  locale: 'pt-BR',
};
```

## Filtros controlados

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [filters]="filters"
  (filtersChange)="filters = $event">
</pg-pivot-grid>
```

```ts
filters = [{ field: 'region', values: ['Sul'] }];
```

Sem `[filters]`, o componente gerencia o estado internamente e ainda emite
`filtersChange`.

## Hierarquia de datas

```ts
dateHierarchy: true                     // ano + mês
dateHierarchy: ['year', 'quarter']      // ano + trimestre
dateHierarchy: ['year', 'quarter', 'month', 'day']
```

Aceita `Date`, ISO (`YYYY-MM-DD`) ou qualquer string parseável por `Date`.

## Demo

Rota: [`/filtros`](https://leonardohessel.github.io/pivot-grid/filtros)
