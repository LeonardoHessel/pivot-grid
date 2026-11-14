# Sticky + teclado

Demonstra:

- colunas de rótulos (row headers) fixas no scroll horizontal;
- largura configurável por campo de linha (`PivotField.width`);
- navegação por teclado nas células de dados.

## Configuração

```ts
import { PivotConfig } from '@leonardohessel/pivot-grid';

export const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região', width: 120 },
    { field: 'city', caption: 'Cidade', width: 180 },
  ],
  columns: [
    { field: 'year', caption: 'Ano' },
    { field: 'month', caption: 'Mês' },
  ],
  values: [{ field: 'amount', caption: 'Quantidade' }],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  emptyText: '-',
  locale: 'pt-BR',
};
```

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  height="420px"
  width="100%"
  [stickyHeaders]="true"
  [stickyRowHeaders]="true">
</pg-pivot-grid>
```

## Teclado

| Tecla | Ação |
|---|---|
| `Tab` | entra/sai do grid (primeira célula de dados) |
| `←` / `→` | célula anterior/próxima na mesma linha |
| `↑` / `↓` | mesma coluna na linha anterior/próxima |
| `Home` / `End` | primeira/última coluna |
| `PageUp` / `PageDown` | 10 linhas acima/abaixo |
| `Enter` / `Space` | aciona o botão de expandir/colapsar focado |

## Demo

Rota: [`/sticky-keyboard`](https://leonardohessel.github.io/pivot-grid/sticky-keyboard)
