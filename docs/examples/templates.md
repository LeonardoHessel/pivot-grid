# Templates de célula e cabeçalho

Adicionado na 1.2.0 (aditivo). Sem template, o layout padrão é mantido.

## Contexto tipado

```ts
import {
  PivotCellTemplateContext,
  PivotHeaderTemplateContext,
} from 'pivot-grid';
```

**Célula** (`cellTemplate`):

| Campo | Tipo |
|---|---|
| `$implicit` / `cell` | `PivotCell` |
| `rowPath` | `string[]` |
| `columnPath` | `string[]` |
| `field` | `string` |
| `value` | `number \| null` |
| `formatted` | `string` |

**Cabeçalho** (`headerTemplate`):

| Campo | Tipo |
|---|---|
| `$implicit` / `node` | `PivotNode` |
| `axis` | `'row' \| 'column'` |
| `path` | `string[]` |
| `field` | `string` |
| `label` | `string` |

## Uso

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [cellTemplate]="cellTpl"
  [headerTemplate]="headerTpl">
</pg-pivot-grid>

<ng-template #cellTpl let-formatted="formatted" let-value="value" let-field="field">
  <span [class.high]="value !== null && value > 180">{{ formatted }}</span>
</ng-template>

<ng-template #headerTpl let-label="label" let-axis="axis">
  <span class="axis-tag">{{ axis === 'row' ? 'L' : 'C' }}</span>
  {{ label }}
</ng-template>
```

Os templates também são aplicados às células de total (linha, coluna e geral),
com `rowPath`/`columnPath` vazios quando o total é global.

## Demo

Rota: [`/templates`](https://leonardohessel.github.io/pivot-grid/templates)
