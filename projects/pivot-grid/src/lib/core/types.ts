/**
 * Public types of the pivot engine and Angular component.
 *
 * Keep this file dependency-free: it is imported by both the primary entry
 * point and the `core` secondary entry point.
 */

export type PivotData = readonly Record<string, unknown>[];

export type Aggregator =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'countDistinct';

export type DateLevel = 'year' | 'quarter' | 'month' | 'day';

export interface PivotFilter {
  field: string;
  values: string[];
}

export interface PivotField {
  /** Field name on the record; dotted paths are supported ("customer.region"). */
  field: string;
  /** Header label. Defaults to `field`. */
  caption?: string;
  /** Fixed width in pixels for leaf columns. */
  width?: number;
  /** Formats the raw header value. */
  formatter?: (value: unknown) => string;
  /** Expands a date field into levels (e.g. ['year','quarter','month']). */
  dateHierarchy?: boolean | DateLevel[];
  /** Enables this field in the component filter bar. */
  filterable?: boolean;
}

export interface PivotAuxiliaryValue {
  field: string;
  aggregator?: Aggregator;
}

export interface PivotValueField {
  field: string;
  caption?: string;
  aggregator?: Aggregator;
  format?: Intl.NumberFormatOptions | ((value: number) => string);
  emptyText?: string;
}

export interface PivotSort {
  by: 'caption' | 'value';
  direction?: 'asc' | 'desc';
  field?: string;
  locale?: string;
}

export interface ConditionalRule {
  field?: string;
  operator:
    | '>'
    | '>='
    | '<'
    | '<='
    | '='
    | '!='
    | 'between'
    | 'notBetween';
  value: number | [number, number];
  style?: Record<string, string>;
  className?: string;
  applyToTotals?: boolean;
  /** When set, the rule compares this auxiliary measure instead of the cell value. */
  measure?: string;
  predicate?: (cell: PivotCell) => boolean;
}

export interface PivotConfig {
  rows: PivotField[];
  columns: PivotField[];
  values: PivotValueField[];
  defaultExpandDepth?: number | 'all';
  showRowTotals?: boolean;
  showColumnTotals?: boolean;
  showGrandTotal?: boolean;
  emptyText?: string;
  locale?: string;
  sort?: {
    rows?: PivotSort;
    columns?: PivotSort;
  };
  /** Filtros aplicados antes da agregação (interseção). */
  filters?: PivotFilter[];
  conditionalRules?: ConditionalRule[];
  /** Measures aggregated per cell but not rendered (used by rules). */
  auxiliaryValues?: PivotAuxiliaryValue[];
  strict?: boolean;
}

export interface PivotNode {
  key: string;
  path: string[];
  field: string;
  value: unknown;
  caption: string;
  level: number;
  children: PivotNode[];
  expanded: boolean;
  aggregates: Record<string, number | null>;
}

export interface PivotCell {
  rowPath: string[];
  columnPath: string[];
  field: string;
  value: number | null;
  formatted: string;
  counts: number;
  /** Auxiliary measures aggregated for the same rows/columns. */
  auxiliary?: Record<string, number | null>;
  className?: string;
  style?: Record<string, string>;
}

export type PivotDiagnosticCode =
  | 'missing-field'
  | 'non-numeric-value'
  | 'invalid-config'
  | 'rule-error';

export interface PivotDiagnostic {
  code: PivotDiagnosticCode;
  message: string;
  field?: string;
  count?: number;
}

export interface PivotResult {
  rowTree: PivotNode[];
  columnTree: PivotNode[];
  rows: PivotNode[];
  columns: PivotNode[];
  cells: ReadonlyMap<string, PivotCell>;
  /** Cells for collapsed/internal nodes (subtree aggregated per column). */
  nodeCells: ReadonlyMap<string, PivotCell>;
  rowTotals: ReadonlyMap<string, PivotCell>;
  columnTotals: ReadonlyMap<string, PivotCell>;
  grandTotals: ReadonlyMap<string, PivotCell>;
  diagnostics: PivotDiagnostic[];
  config: PivotConfig;
}

export interface PivotState {
  expanded: Record<string, boolean>;
  sort?: {
    rows?: PivotSort;
    columns?: PivotSort;
  };
}

export interface PivotLabels {
  grandTotal: string;
  rowTotal: string;
  columnTotal: string;
  empty: string;
  noData: string;
  loading: string;
  expand: string;
  collapse: string;
  export: string;
  /** Optional; default 'Clear filters'. */
  clearFilters?: string;
}

export interface PivotExportRow {
  key: string;
  path: string[];
  collapsed: boolean;
}

export interface XlsxExportOptions {
  filename?: string;
  includeTotals?: boolean;
  mode?: 'visible' | 'full';
  rows?: readonly PivotExportRow[];
}

export interface CsvExportOptions {
  filename?: string;
  delimiter?: string;
  bom?: boolean;
  includeTotals?: boolean;
  mode?: 'visible' | 'full';
  rows?: readonly PivotExportRow[];
}

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









