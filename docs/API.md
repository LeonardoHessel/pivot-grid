# API pública — `@leonardohessel/pivot-grid`

Referência detalhada dos tipos, inputs, outputs, métodos e tokens de tema.
Para o comportamento esperado, consulte [`SPECIFICATION.md`](./SPECIFICATION.md).

## 1. Importação

```ts
import { PivotGridComponent } from '@leonardohessel/pivot-grid';
import type {
  PivotConfig, PivotData, PivotState, PivotCellEvent,
} from '@leonardohessel/pivot-grid';
```

O engine puro também é exportado pelo pacote:

```ts
import { buildPivot } from '@leonardohessel/pivot-grid';
```

## 2. Tipos do modelo

```ts
export type PivotData = readonly Record<string, unknown>[];

export type Aggregator =
  | 'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct';

export interface PivotField {
  /** Campo no registro; aceita caminho com ponto: "customer.region". */
  field: string;
  /** Rótulo exibido no cabeçalho. Default: field. */
  caption?: string;
  /** Largura fixa em px (aplicada às folhas da coluna). */
  width?: number;
  /** Alinhamento do conteúdo. Default: 'left' (linhas) / 'right' (valores). */
  align?: 'left' | 'center' | 'right';
  /** Formata o valor bruto do cabeçalho. */
  formatter?: (value: unknown) => string;
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
  emptyText?: string;
}

export interface PivotSort {
  by: 'caption' | 'value';
  direction?: 'asc' | 'desc';          // default 'asc'
  field?: string;                      // usado quando by = 'value'
  locale?: string;
}

export interface ConditionalRule {
  target?: 'cell' | 'row' | 'column';  // default 'cell'
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
  values: PivotValueField[];           // v1: exatamente um
  defaultExpandDepth?: number | 'all'; // default 1
  showRowTotals?: boolean;             // default false
  showColumnTotals?: boolean;          // default false
  showGrandTotal?: boolean;            // default false
  totalsPosition?: 'start' | 'end';    // default 'end'
  alwaysShowRowTotals?: boolean;       // default false
  emptyText?: string;                  // default ''
  locale?: string;                     // default navigator.language
  sort?: { rows?: PivotSort; columns?: PivotSort };
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

export interface PivotResult {
  rowTree: PivotNode[];
  columnTree: PivotNode[];
  rows: PivotNode[];                   // folhas na ordem de exibição
  columns: PivotNode[];                // folhas na ordem de exibição
  cells: ReadonlyMap<string, PivotCell>; // chave: `${rowKey}||${columnKey}||${field}`
  rowTotals: ReadonlyMap<string, PivotCell>;
  columnTotals: ReadonlyMap<string, PivotCell>;
  grandTotal: PivotCell | null;
  diagnostics: PivotDiagnostic[];
  config: PivotConfig;
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
| `state` | `PivotState \| null` | não | `null` | Estado controlado (expansão/ordenação) |
| `loading` | `boolean` | não | `false` | Overlay de carregamento |
| `width` | `number \| string` | não | `'100%'` | Largura do container; scroll horizontal interno |
| `height` | `number \| string` | não | `'100%'` | Altura fixa com scroll vertical interno |
| `stickyHeaders` | `boolean` | não | `true` | Cabeçalho de colunas fixo no scroll |
| `stickyRowHeaders` | `boolean` | não | `true` | Coluna de rótulos fixa no scroll horizontal |
| `density` | `'compact' \| 'default' \| 'comfortable'` | não | `'default'` | Densidade visual |
| `labels` | `Partial<PivotLabels>` | não | `{}` | Textos/i18n |

### 4.2 Outputs

| Output | Payload |
|---|---|
| `cellClick` | `PivotCellEvent` |
| `headerClick` | `PivotHeaderEvent` |
| `expandChange` | `PivotExpandEvent` |
| `sortChange` | `{ rows?: PivotSort; columns?: PivotSort }` |
| `stateChange` | `PivotState` |
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
| `refresh()` | Reprocessa a matriz (raro; inputs já reagem) |

### 4.4 Exemplo completo

```ts
import { Component, viewChild } from '@angular/core';
import {
  PivotGridComponent, PivotConfig, PivotLabels, PivotState,
} from '@leonardohessel/pivot-grid';

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

## 5. Exportação

```ts
export interface CsvExportOptions {
  filename?: string;          // default 'pivot.csv'
  delimiter?: string;         // default ','
  bom?: boolean;              // default true
  includeTotals?: boolean;    // default true
}

export interface XlsxExportOptions {
  filename?: string;          // default 'pivot.xlsx'
  includeTotals?: boolean;    // default true
}
```

## 6. Tokens de tema (CSS variables)

| Variável | Default | Uso |
|---|---|---|
| `--pg-font-family` | `inherit` | Tipografia |
| `--pg-font-size` | `13px` | Texto |
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
| `multiple-values-unsupported` | `values.length > 1` na v1 | Usa o primeiro |
| `invalid-config` | `values` vazio ou eixos inválidos | Estado vazio |
| `rule-error` | Exceção em `predicate` | Regra ignorada |

Com `strict: true` (dev), os códigos acima lançam `PivotError`.







