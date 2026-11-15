# API pública — `pivot-grid`

> **API estável (2.x).** Superfície congelada desde a 1.0; a linha 2.x é
> aditiva (2.0/2.1 não quebram a API). Mudanças de contrato só em major. A
> única superfície pública é `public-api.ts` (deep imports bloqueados pelos
> `exports` do pacote).

Referência detalhada dos tipos, inputs, outputs, métodos e tokens de tema.
Para o comportamento esperado, consulte [`SPECIFICATION.md`](./SPECIFICATION.md).

## 1. Importação

```ts
import { PivotGridComponent } from 'pivot-grid';
import type {
  PivotConfig, PivotData, PivotState, PivotCellEvent,
} from 'pivot-grid';
```

O engine puro também é exportado pelo pacote:

```ts
import { buildPivot } from 'pivot-grid';
```

## 2. Tipos do modelo

```ts
export type PivotData = readonly Record<string, unknown>[];

export type Aggregator =
  | 'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct';

export type PivotRowHeaderLayout = 'columns' | 'tree';

export type DateLevel = 'year' | 'quarter' | 'month' | 'day';

export interface PivotFilter {
  field: string;
  values: string[];
}

export interface PivotField {
  /** Campo no registro; aceita caminho com ponto: "customer.region". */
  field: string;
  /** Rótulo exibido no cabeçalho. Default: field. */
  caption?: string;
  /** Largura fixa em px (aplicada às folhas da coluna). */
  width?: number;
  /** Formata o valor bruto do cabeçalho. */
  formatter?: (value: unknown) => string;
  /** Alinhamento das células desta medida. */
  align?: 'left' | 'center' | 'right';
  /** Expande um campo de data em níveis. */
  dateHierarchy?: boolean | DateLevel[];
  /** Habilita o campo na barra de filtros. */
  filterable?: boolean;
}

export interface PivotAuxiliaryValue {
  field: string;
  aggregator?: Aggregator;             // default 'sum'
}

export interface PivotValueField {
  field: string;
  caption?: string;
  aggregator?: Aggregator;             // default 'sum'
  format?: Intl.NumberFormatOptions | ((value: number) => string);
  /** Alinhamento desta medida (sobrescreve --pg-cell-align). */
  align?: 'left' | 'center' | 'right';
  emptyText?: string;
}

export interface PivotSort {
  by: 'caption' | 'value';
  direction?: 'asc' | 'desc';          // default 'asc'
  field?: string;                      // usado quando by = 'value'
  locale?: string;
}

export interface ConditionalRule {
  field?: string;
  operator: '>' | '>=' | '<' | '<=' | '=' | '!=' | 'between' | 'notBetween';
  value: number | [number, number];
  style?: Record<string, string>;
  className?: string;
  applyToTotals?: boolean;             // default false
  /** Compara esta medida auxiliar em vez do valor da célula. */
  measure?: string;
  predicate?: (cell: PivotCell) => boolean;
}

export interface PivotConfig {
  rows: PivotField[];                  // pode ser vazio
  columns: PivotField[];               // pode ser vazio
  values: PivotValueField[];           // uma ou mais medidas
  defaultExpandDepth?: number | 'all'; // default 1
  showRowTotals?: boolean;             // default false
  showColumnTotals?: boolean;          // default false
  showGrandTotal?: boolean;            // default false
  emptyText?: string;                  // default ''
  locale?: string;                     // default navigator.language
  sort?: { rows?: PivotSort; columns?: PivotSort };
  /** Filtros aplicados antes da agregação. */
  filters?: PivotFilter[];
  conditionalRules?: ConditionalRule[];
  /** Medidas agregadas por célula mas não renderizadas (usadas por `measure`). */
  auxiliaryValues?: PivotAuxiliaryValue[];
  strict?: boolean;                    // default false (diagnósticos viram erro)
}
```

## 3. Resultado do engine

```ts
export interface PivotNode {
  key: string;                         // path.join('\u001f')
  path: string[];
  field: string;
  value: unknown;
  caption: string;
  level: number;
  children: PivotNode[];               // vazio em folhas
  expanded: boolean;
  aggregates: Record<string, number | null>; // por campo de valor
}

export interface PivotCell {
  rowPath: string[];
  columnPath: string[];
  field: string;
  value: number | null;
  aggregatedValue?: number;            // bruto, antes da formatação
  formatted: string;
  counts: number;                      // quantos registros contribuíram
  /** Medidas auxiliares agregadas para o mesmo par linha/coluna. */
  auxiliary?: Record<string, number | null>;
  className?: string;
  style?: Record<string, string>;
}

export interface PivotDiagnostic {
  code:
    | 'missing-field'
    | 'non-numeric-value'
    | 'multiple-values-unsupported'
    | 'invalid-config'
    | 'rule-error';
  message: string;
  field?: string;
  count?: number;
}

export interface PivotState {
  expanded: Record<string, boolean>;
  /** Larguras por chave de coluna (2.1+). */
  columns?: Record<string, number>;
  sort?: { rows?: PivotSort; columns?: PivotSort };
}
export interface PivotResult {
  rowTree: PivotNode[];
  columnTree: PivotNode[];
  rows: PivotNode[];                   // folhas na ordem de exibição
  columns: PivotNode[];                // folhas na ordem de exibição
  cells: ReadonlyMap<string, PivotCell>; // chave: `${rowKey}||${columnKey}||${field}`
  rowTotals: ReadonlyMap<string, PivotCell>;
  columnTotals: ReadonlyMap<string, PivotCell>;
  grandTotals: ReadonlyMap<string, PivotCell>;  // por campo de medida
  diagnostics: PivotDiagnostic[];
  config: PivotConfig;
  /** Registros de origem da célula/total, sob demanda. */
  recordsForCell(
    rowPath: readonly string[],
    columnPath: readonly string[],
  ): readonly Record<string, unknown>[];
}

export function buildPivot(data: PivotData, config: PivotConfig): PivotResult;
```

## 4. Componente

```ts
@Component({
  selector: 'pg-pivot-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotGridComponent {}
```

### 4.1 Inputs

| Input | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `data` | `PivotData` | sim | `[]` | Registros planos |
| `config` | `PivotConfig` | sim | — | Configuração dos eixos |
| `state` | `PivotState \| null` | não | `null` | Estado controlado (expansão, ordenação e larguras) |
| `loading` | `boolean` | não | `false` | Overlay de carregamento |
| `width` | `number \| string` | não | `'100%'` | Largura do container; scroll horizontal interno |
| `height` | `number \| string` | não | `'100%'` | Altura fixa com scroll vertical interno |
| `stickyHeaders` | `boolean` | não | `true` | Cabeçalho de colunas fixo no scroll |
| `stickyRowHeaders` | `boolean` | não | `true` | Coluna de rótulos fixa no scroll horizontal |
| `virtualScroll` | `boolean` | não | `false` | Virtualiza as linhas renderizadas |
| `rowHeight` | `number` | não | `32` | Altura fixa por linha (px) no modo virtual |
| `virtualOverscan` | `number` | não | `5` | Linhas extras acima/abaixo da janela |
| `density` | `'compact' \| 'default' \| 'comfortable'` | não | `'default'` | Densidade visual |
| `labels` | `Partial<PivotLabels>` | não | `{}` | Textos/i18n |
| `filters` | `PivotFilter[] \| null` | não | `null` | Filtros controlados (barra) |
| `cellTemplate` | `TemplateRef<PivotCellTemplateContext> \| null` | não | `null` | Template da célula |
| `minColumnWidth` | `number` | não | `60` | Largura mínima ao redimensionar |
| `maxColumnWidth` | `number` | não | `600` | Largura máxima ao redimensionar |
| `rowHeaderLayout` | `'columns' \| 'tree'` | não | `'columns'` | Layout do cabeçalho de linha |
| `indentSize` | `number` | não | `16` | Indentação por nível no modo tree (px) |
| `rowHeaderWidth` | `number` | não | `200` | Largura da coluna tree (px) |
| `showValueHeader` | `boolean` | não | `true` | Cabeçalho da medida (uma medida) |
| `cellDetails` | `boolean` | não | `false` | Abre o painel de detalhes ao clicar |
| `detailsColumns` | `PivotField[] \| string[]` | não | `[]` | Colunas do painel (default: campos do registro) |
| `detailsTemplate` | `TemplateRef<PivotCellDetailsContext> \| null` | não | `null` | Substitui o corpo do painel |
| `headerTemplate` | `TemplateRef<PivotHeaderTemplateContext> \| null` | não | `null` | Template do cabeçalho |

### 4.2 Outputs

| Output | Payload |
|---|---|
| `cellClick` | `PivotCellEvent` |
| `headerClick` | `PivotHeaderEvent` |
| `expandChange` | `PivotExpandEvent` |
| `sortChange` | `{ rows?: PivotSort; columns?: PivotSort }` |
| `stateChange` | `PivotState` |
| `filtersChange` | `PivotFilter[]` |
| `columnStateChange` | `Record<string, number>` (larguras por coluna) |
| `cellDetailsOpen` | `PivotCellDetailsContext` |
| `cellDetailsClose` | `void` |
| `exportComplete` | `{ format: 'csv' \| 'xlsx'; filename: string }` |

```ts
export interface PivotCellEvent {
  rowPath: string[];
  columnPath: string[];
  field: string;
  value: number | null;
  formatted: string;
  cell: PivotCell;
  event: MouseEvent | KeyboardEvent;
}

export interface PivotHeaderEvent {
  axis: 'row' | 'column';
  path: string[];
  field: string;
  event: MouseEvent | KeyboardEvent;
}

export interface PivotExpandEvent {
  axis: 'row' | 'column';
  path: string[];
  expanded: boolean;
}
```

### 4.3 Métodos (via `viewChild`)

| Método | Descrição |
|---|---|
| `expandAll()` | Expande todos os nós |
| `collapseAll()` | Colapsa todos os nós |
| `toggle(path: string[])` | Alterna um nó |
| `getState(): PivotState` | Estado atual |
| `setState(state: PivotState)` | Aplica estado |
| `exportCsv(options?: CsvExportOptions): void` | Exporta CSV |
| `exportExcel(options?: XlsxExportOptions): void` | Exporta XLSX nativo (ZIP + XML, sem dependência) |

### 4.4 Exemplo completo

```ts
import { Component, viewChild } from '@angular/core';
import {
  PivotGridComponent, PivotConfig, PivotLabels, PivotState,
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
      [state]="state"
      height="600px"
      width="100%"
      (stateChange)="state = $event">
    </pg-pivot-grid>

    <button (click)="grid.exportCsv()">CSV</button>
    <button (click)="grid.exportExcel()">Excel</button>
  `,
})
export class ReportComponent {
  readonly rows = [
    { region: 'Sul', city: 'A', year: '2026', month: '2026-01', amount: 120, goal: 0.8 },
    { region: 'Sul', city: 'B', year: '2026', month: '2026-02', amount: 80, goal: 1.2 },
  ];

  state: PivotState | null = null;

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
    defaultExpandDepth: 1,
    emptyText: '-',
    locale: 'pt-BR',
  };
}
```

## 4.5 Templates

`cellTemplate` recebe `PivotCellTemplateContext` e `headerTemplate` recebe
`PivotHeaderTemplateContext`. Sem template, o layout padrão é mantido. Os
templates de célula também valem para totais (linha, coluna e geral).

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [cellTemplate]="cellTpl"
  [headerTemplate]="headerTpl">
</pg-pivot-grid>

<ng-template #cellTpl let-formatted="formatted" let-value="value">
  <strong [class.high]="value !== null && value > 180">{{ formatted }}</strong>
</ng-template>

<ng-template #headerTpl let-label="label" let-axis="axis">
  {{ axis }}: {{ label }}
</ng-template>
```

## 4.6 Redimensionamento de colunas

- Alça no cabeçalho: arrastar, setas (`←`/`→`, ±10px), `Home` restaura e
  duplo clique restaura.
- `minColumnWidth`/`maxColumnWidth` limitam o arraste.
- Larguras persistem em `PivotState.columns` e são emitidas em
  `columnStateChange`.
- Sem larguras no estado, o layout permanece o padrão.

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [state]="state"
  (columnStateChange)="state = { ...state, columns: $event }">
</pg-pivot-grid>
```

## 4.7 Layout do cabeçalho de linha

`rowHeaderLayout: 'columns' | 'tree'` (default `columns`).

- **`columns`**: uma coluna por campo de linha (layout anterior, inalterado).
- **`tree`**: uma única coluna hierárquica indentada por `indentSize` (default
  16), com chevrons, largura `rowHeaderWidth` (default 200), sticky,
  virtualização, teclado, `headerTemplate`, `cellTemplate`, filtros,
  hierarquia de datas, export e estado controlado. Nós internos usam os
  agregados próprios (`nodeCells`/`rowTotals`), então cada nível exibe seus
  valores.

`showValueHeader: false` remove a linha de cabeçalho da medida quando há
**uma** medida. Com duas ou mais, a linha é mantida (necessária para
distinguir) e um diagnóstico `ignored-option` é adicionado a
`PivotResult.diagnostics`.

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  rowHeaderLayout="tree"
  [showValueHeader]="false"
  [indentSize]="18"
  [rowHeaderWidth]="220">
</pg-pivot-grid>
```

```ts
const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região' },
    { field: 'city', caption: 'CDP Principal' },
    { field: 'cdp', caption: 'CDP' },
  ],
  columns: [{ field: 'month', caption: 'Mês' }],
  values: [{ field: 'amount', caption: 'MÉDIA POD.', aggregator: 'avg' }],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  defaultExpandDepth: 'all',
};
```

## 4.8 Detalhes da célula (drill-down)

Com `cellDetails: true`, clicar (ou `Enter`/`Espaço`) em uma célula abre um
diálogo com o resumo agregado e os registros de origem. Funciona em células
normais, totais e no modo tree.

```ts
cellDetails?: boolean;                     // default false
detailsColumns?: PivotField[] | string[]; // default: campos do registro
detailsTemplate?: TemplateRef<PivotCellDetailsContext>;
```

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [cellDetails]="true"
  [detailsColumns]="['region', 'city', 'month', 'amount']"
  [labels]="{ detailsTitle: 'Detalhes da célula', detailsClose: 'Fechar' }">
</pg-pivot-grid>
```

O engine expõe `PivotResult.recordsForCell(rowPath, columnPath)` sob demanda,
sem copiar a base. O diálogo tem `role="dialog"`, `aria-modal`, foco preso,
fecha com `Esc` e devolve o foco ao gatilho.

## 5. Exportação

```ts
export interface PivotExportRow {
  key: string;
  path: string[];
  collapsed: boolean;
}

export interface CsvExportOptions {
  filename?: string;          // default 'pivot.csv'
  delimiter?: string;         // default ','
  bom?: boolean;              // default true
  includeTotals?: boolean;    // default true
  mode?: 'visible' | 'full';  // default 'full'
  rows?: readonly PivotExportRow[]; // obrigatório no modo visible
}

export interface XlsxExportOptions {
  filename?: string;          // default 'pivot.xlsx'
  includeTotals?: boolean;    // default true
  mode?: 'visible' | 'full';  // default 'full'
  rows?: readonly PivotExportRow[]; // obrigatório no modo visible
}
```

## 6. Tokens de tema (CSS variables)

| Variável | Default | Uso |
|---|---|---|
| `--pg-font-family` | `inherit` | Tipografia |
| `--pg-font-size` | `13px` | Texto |
| `--pg-header-font-size` | `12px` | Tipografia dos cabeçalhos |
| `--pg-cell-font-size` | `13px` | Tipografia das células |
| `--pg-row-height` | `auto` | Altura base de células/cabeçalhos |
| `--pg-cell-align` | `right` | Alinhamento das células de valor |
| `--pg-rowheader-align` | `left` | Alinhamento do cabeçalho de linha |
| `--pg-cell-font-weight` | `400` | Peso das células |
| `--pg-header-font-weight` | `600` | Peso dos cabeçalhos de coluna |
| `--pg-rowheader-font-weight` | `600` | Peso dos rótulos de linha |
| `--pg-total-font-weight` | `600` | Peso das células de total |
| `--pg-chevron-color` | `var(--pg-color-muted)` | Cor da seta |
| `--pg-chevron-size` | `18px` | Glifo e hit area (`size × 1.5`) |
| `--pg-rowheader-bg` | `#fff` | Fundo do cabeçalho de linha |
| `--pg-group-bg` | `var(--pg-color-total-bg)` | Fundo de linhas de grupo |
| `--pg-rowheader-width` | `200px` | Largura no modo tree |
| `--pg-color-text` | `#1f2937` | Texto |
| `--pg-color-muted` | `#6b7280` | Texto secundário |
| `--pg-color-border` | `#e5e7eb` | Bordas |
| `--pg-color-header-bg` | `#f9fafb` | Cabeçalho |
| `--pg-color-header-text` | `#111827` | Texto do cabeçalho |
| `--pg-color-row-hover` | `#f3f4f6` | Hover |
| `--pg-color-total-bg` | `#f0f9ff` | Totais |
| `--pg-cell-padding-y` | `6px` | Densidade vertical |
| `--pg-cell-padding-x` | `8px` | Densidade horizontal |
| `--pg-radius` | `6px` | Cantos |
| `--pg-focus-ring` | `#2563eb` | Foco |

Classes estáveis: `.pg-root`, `.pg-table`, `.pg-header`, `.pg-header-cell`,
`.pg-row`, `.pg-cell`, `.pg-total`, `.pg-expander`, `.pg-empty`, `.pg-loading`.

## 7. Rótulos

```ts
export interface PivotCellTemplateContext {
  $implicit: PivotCell;
  rowPath: string[];
  columnPath: string[];
  field: string;
  value: number | null;
  formatted: string;
  cell: PivotCell;
}

export interface PivotCellDetailsContext {
  cell: PivotCell;
  rowPath: string[];
  columnPath: string[];
  field: string;
  value: number | null;
  formatted: string;
  records: readonly Record<string, unknown>[];
}

export interface PivotHeaderTemplateContext {
  $implicit: PivotNode;
  axis: 'row' | 'column';
  path: string[];
  field: string;
  label: string;
  node: PivotNode;
}
export interface PivotLabels {
  grandTotal: string;   // 'Grand total'
  rowTotal: string;     // 'Row total'
  columnTotal: string;  // 'Column total'
  empty: string;        // ''
  noData: string;       // 'No data'
  loading: string;      // 'Loading…'
  expand: string;       // 'Expand'
  collapse: string;     // 'Collapse'
  export: string;       // 'Export'
}
```

## 8. Erros e diagnósticos

| Código | Quando | Efeito |
|---|---|---|
| `missing-field` | Campo não existe nos dados | Célula não é agregada; aviso |
| `non-numeric-value` | Valor não numérico | Ignorado; aviso com contagem |
| `invalid-config` | `values` vazio ou eixos inválidos | Estado vazio |
| `rule-error` | Exceção em `predicate` | Regra ignorada |

Com `strict: true` (dev), os códigos acima lançam `PivotError`.

## 9. Exportação

- `mode: 'full'` (default): todas as folhas da matriz.
- `mode: 'visible'`: apenas as linhas atualmente visíveis (expandidas ou
  colapsadas). O componente preenche `rows` automaticamente ao chamar
  `exportCsv({ mode: 'visible' })` / `exportExcel({ mode: 'visible' })`.

## 10. Exports públicos

Superfície estável — somente o que sai de `public-api.ts`:

**Componente**

- `PivotGridComponent`

**Funções**

- `buildPivot`
- `cellKey`
- `toCsv`
- `toXlsx`
- `PivotError`

**Tipos**

- `Aggregator`
- `ConditionalRule`
- `CsvExportOptions`
- `PivotAuxiliaryValue`
- `PivotCell`
- `PivotCellEvent`
- `PivotConfig`
- `PivotData`
- `PivotDiagnostic`
- `PivotDiagnosticCode`
- `PivotExpandEvent`
- `PivotExportRow`
- `PivotField`
- `PivotHeaderEvent`
- `PivotLabels`
- `PivotNode`
- `PivotResult`
- `PivotSort`
- `PivotState`
- `PivotValueField`
- `XlsxExportOptions`
- `DateLevel`
- `PivotFilter`
- `PivotRowHeaderLayout`
- `PivotCellDetailsContext`
- `PivotCellTemplateContext`
- `PivotHeaderTemplateContext`

## 11. Exemplos

- [docs/examples/sticky-keyboard.md](./examples/sticky-keyboard.md) — row headers fixos e teclado.
- [docs/examples/](./examples/README.md) — índice por funcionalidade.






