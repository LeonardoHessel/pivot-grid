/**
 * Public types for the primary entry point.
 *
 * Kept structurally identical to core/src/types.ts because ng-packagr does
 * not support cross-entry-point imports. Keep both files in sync.
 */

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

export interface PivotField {
  /** Field name on the record; dotted paths are supported ("customer.region"). */
  field: string;
  /** Header label. Defaults to `field`. */
  caption?: string;
  /** Fixed width in pixels for leaf columns. */
  width?: number;
  /** Content alignment. */
  align?: 'left' | 'center' | 'right';
  /** Formats the raw header value. */
  formatter?: (value: unknown) => string;
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
  target?: 'cell' | 'row' | 'column';
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
  totalsPosition?: 'start' | 'end';
  alwaysShowRowTotals?: boolean;
  emptyText?: string;
  locale?: string;
  sort?: {
    rows?: PivotSort;
    columns?: PivotSort;
  };
  conditionalRules?: ConditionalRule[];
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
  className?: string;
  style?: Record<string, string>;
}

export type PivotDiagnosticCode =
  | 'missing-field'
  | 'non-numeric-value'
  | 'multiple-values-unsupported'
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
  rowTotals: ReadonlyMap<string, PivotCell>;
  columnTotals: ReadonlyMap<string, PivotCell>;
  grandTotal: PivotCell | null;
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
}

export interface CsvExportOptions {
  filename?: string;
  delimiter?: string;
  bom?: boolean;
  mode?: 'visible' | 'full';
  includeTotals?: boolean;
}

