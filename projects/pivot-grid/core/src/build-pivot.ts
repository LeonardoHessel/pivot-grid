import {
  Aggregator,
  ConditionalRule,
  PivotCell,
  PivotConfig,
  PivotData,
  PivotDiagnostic,
  PivotField,
  PivotNode,
  PivotResult,
  PivotSort,
} from './types';
import {
  AggState,
  addRecord,
  createState,
  finalize,
  mergeStates,
} from './aggregate';
import {
  compareCaptions,
  defaultLocale,
  getPath,
  numberFormatter,
  toKey,
  toNumber,
} from './util';

interface InternalNode {
  key: string;
  path: string[];
  field: string;
  value: unknown;
  caption: string;
  level: number;
  children: Map<string, InternalNode>;
  records: number[];
  state: AggState | null;
  expanded: boolean;
  aggregates: Record<string, number | null>;
}

interface Tree {
  roots: InternalNode[];
  leaves: InternalNode[];
}

interface Normalized {
  config: PivotConfig;
  locale: string;
  emptyText: string;
  diagnostics: PivotDiagnostic[];
  valid: boolean;
}

export function cellKey(rowKey: string, columnKey: string, field: string): string {
  return `${rowKey}||${columnKey}||${field}`;
}

function normalizeConfig(config: PivotConfig): Normalized {
  const diagnostics: PivotDiagnostic[] = [];
  const locale = config.locale ?? defaultLocale();
  const emptyText = config.emptyText ?? '';
  const rows = (config.rows ?? []).map((field) => ({ ...field }));
  const columns = (config.columns ?? []).map((field) => ({ ...field }));
  const values = (config.values ?? []).map((value) => ({ ...value }));

  if (values.length === 0) {
    diagnostics.push({
      code: 'invalid-config',
      message: 'config.values must contain at least one value field.',
    });
  } else if (values.length > 1) {
    diagnostics.push({
      code: 'multiple-values-unsupported',
      message: 'Only one value field is supported in v1; using the first one.',
      field: values[1]?.field,
    });
  }

  const findDuplicate = (fields: PivotField[]): string | null => {
    const seen = new Set<string>();
    for (const field of fields) {
      if (!field.field) {
        return '';
      }
      if (seen.has(field.field)) {
        return field.field;
      }
      seen.add(field.field);
    }
    return null;
  };

  const duplicateRow = findDuplicate(rows);
  const duplicateColumn = findDuplicate(columns);
  if (duplicateRow !== null || duplicateColumn !== null) {
    diagnostics.push({
      code: 'invalid-config',
      message: `Duplicate field in axis: ${duplicateRow ?? duplicateColumn}`,
      field: duplicateRow ?? duplicateColumn ?? undefined,
    });
  }

  const normalized: PivotConfig = {
    ...config,
    rows,
    columns,
    values,
    locale,
    emptyText,
    defaultExpandDepth: config.defaultExpandDepth ?? 1,
    totalsPosition: config.totalsPosition ?? 'end',
    sort: {
      rows: config.sort?.rows,
      columns: config.sort?.columns,
    },
  };

  return {
    config: normalized,
    locale,
    emptyText,
    diagnostics,
    valid: values.length > 0 && duplicateRow === null && duplicateColumn === null,
  };
}

function isExpandedByDefault(level: number, depth: number | 'all'): boolean {
  return depth === 'all' ? true : level < depth;
}

function buildTree(
  data: PivotData,
  fields: PivotField[],
  depth: number | 'all',
  diagnostics: PivotDiagnostic[],
): Tree {
  if (fields.length === 0) {
    const root: InternalNode = {
      key: '',
      path: [],
      field: '',
      value: null,
      caption: '',
      level: 0,
      children: new Map(),
      records: data.map((_record, index) => index),
      state: null,
      expanded: false,
      aggregates: {},
    };
    return { roots: [root], leaves: [root] };
  }

  const roots: InternalNode[] = [];
  const rootIndex = new Map<string, InternalNode>();
  const leaves: InternalNode[] = [];
  const reportedMissing = new Set<string>();

  data.forEach((record, index) => {
    let parent: InternalNode | null = null;
    let siblings = rootIndex;
    const path: string[] = [];

    fields.forEach((field, level) => {
      const raw = getPath(record, field.field);
      if (raw === undefined && !reportedMissing.has(field.field)) {
        reportedMissing.add(field.field);
        diagnostics.push({
          code: 'missing-field',
          message: `Field "${field.field}" is missing on at least one record.`,
          field: field.field,
        });
      }

      const valueKey = toKey(raw);
      path.push(valueKey);

      let node = siblings.get(valueKey);
      if (!node) {
        node = {
          key: path.join('\u001f'),
          path: [...path],
          field: field.field,
          value: raw,
          caption: field.formatter ? field.formatter(raw) : valueKey,
          level,
          children: new Map(),
          records: [],
          state: null,
          expanded: isExpandedByDefault(level, depth),
          aggregates: {},
        };
        siblings.set(valueKey, node);
        if (parent) {
          parent.children.set(valueKey, node);
        } else {
          roots.push(node);
        }
        if (level === fields.length - 1) {
          leaves.push(node);
        }
      }

      parent = node;
      siblings = node.children;

      if (level === fields.length - 1) {
        node.records.push(index);
      }
    });
  });

  return { roots, leaves };
}

function computeStates(
  node: InternalNode,
  data: PivotData,
  valueField: string,
  aggregator: Aggregator,
): AggState {
  const state = createState(aggregator);
  if (node.children.size === 0) {
    for (const index of node.records) {
      addRecord(state, aggregator, getPath(data[index] ?? {}, valueField));
    }
  } else {
    for (const child of node.children.values()) {
      mergeStates(state, computeStates(child, data, valueField, aggregator));
    }
  }
  node.state = state;
  node.aggregates = { [valueField]: finalize(state, aggregator) };
  return state;
}

function sortNodes(
  nodes: InternalNode[],
  sort: PivotSort | undefined,
  locale: string,
  valueField: string,
): void {
  if (!sort) {
    return;
  }
  const sign = (sort.direction ?? 'asc') === 'desc' ? -1 : 1;
  const byValue = sort.by === 'value';

  const decorated = nodes.map((node, index) => ({ node, index }));
  decorated.sort((left, right) => {
    let result: number;
    if (byValue) {
      const leftValue = left.node.aggregates[valueField] ?? null;
      const rightValue = right.node.aggregates[valueField] ?? null;
      if (leftValue === null && rightValue === null) {
        result = 0;
      } else if (leftValue === null) {
        result = 1;
      } else if (rightValue === null) {
        result = -1;
      } else {
        result = leftValue - rightValue;
      }
    } else {
      result = compareCaptions(left.node.caption, right.node.caption, locale);
    }
    return result === 0 ? left.index - right.index : result * sign;
  });

  nodes.splice(0, nodes.length, ...decorated.map((entry) => entry.node));
}

function sortTree(
  nodes: InternalNode[],
  sort: PivotSort | undefined,
  locale: string,
  valueField: string,
): void {
  sortNodes(nodes, sort, locale, valueField);
  for (const node of nodes) {
    sortTree(Array.from(node.children.values()), sort, locale, valueField);
  }
}

function collectLeaves(nodes: InternalNode[]): InternalNode[] {
  const leaves: InternalNode[] = [];
  const visit = (node: InternalNode): void => {
    if (node.children.size === 0) {
      leaves.push(node);
      return;
    }
    for (const child of node.children.values()) {
      visit(child);
    }
  };
  for (const node of nodes) {
    visit(node);
  }
  return leaves;
}

function formatValue(
  value: number | null,
  valueField: { format?: Intl.NumberFormatOptions | ((value: number) => string); emptyText?: string },
  locale: string,
  emptyText: string,
): string {
  if (value === null) {
    return valueField.emptyText ?? emptyText;
  }
  if (typeof valueField.format === 'function') {
    return valueField.format(value);
  }
  const options: Intl.NumberFormatOptions =
    typeof valueField.format === 'object' && valueField.format !== null
      ? valueField.format
      : { maximumFractionDigits: 0 };
  return numberFormatter(locale, options).format(value);
}

function matchesRule(cell: PivotCell, rule: ConditionalRule): boolean {
  if (rule.field && rule.field !== cell.field) {
    return false;
  }
  if (cell.value === null) {
    return false;
  }
  const value = cell.value;
  const expected = rule.value;
  switch (rule.operator) {
    case '>':
      return value > (expected as number);
    case '>=':
      return value >= (expected as number);
    case '<':
      return value < (expected as number);
    case '<=':
      return value <= (expected as number);
    case '=':
      return value === (expected as number);
    case '!=':
      return value !== (expected as number);
    case 'between': {
      const [min, max] = expected as [number, number];
      return value >= min && value <= max;
    }
    case 'notBetween': {
      const [min, max] = expected as [number, number];
      return value < min || value > max;
    }
    default:
      return false;
  }
}

function applyRules(
  cell: PivotCell,
  rules: ConditionalRule[] | undefined,
  isTotal: boolean,
  diagnostics: PivotDiagnostic[],
): void {
  if (!rules || rules.length === 0) {
    return;
  }
  for (const rule of rules) {
    if (isTotal && !rule.applyToTotals) {
      continue;
    }
    let matched: boolean;
    if (rule.predicate) {
      try {
        matched = rule.predicate(cell);
      } catch {
        diagnostics.push({
          code: 'rule-error',
          message: 'A conditional rule predicate threw an error and was ignored.',
        });
        continue;
      }
    } else {
      matched = matchesRule(cell, rule);
    }
    if (matched) {
      if (rule.className) {
        cell.className = rule.className;
      }
      if (rule.style) {
        cell.style = { ...rule.style };
      }
      return;
    }
  }
}

function toPublicNode(node: InternalNode): PivotNode {
  return {
    key: node.key,
    path: node.path,
    field: node.field,
    value: node.value,
    caption: node.caption,
    level: node.level,
    children: Array.from(node.children.values()).map(toPublicNode),
    expanded: node.expanded,
    aggregates: { ...node.aggregates },
  };
}

const emptyResult = (
  config: PivotConfig,
  diagnostics: PivotDiagnostic[],
): PivotResult => ({
  rowTree: [],
  columnTree: [],
  rows: [],
  columns: [],
  cells: new Map(),
  rowTotals: new Map(),
  columnTotals: new Map(),
  grandTotal: null,
  diagnostics,
  config,
});

export function buildPivot(data: PivotData, config: PivotConfig): PivotResult {
  const normalized = normalizeConfig(config);
  const { locale, emptyText, diagnostics } = normalized;

  if (!normalized.valid) {
    return emptyResult(normalized.config, diagnostics);
  }

  const valueConfig = normalized.config.values[0];
  const aggregator: Aggregator = valueConfig.aggregator ?? 'sum';
  const valueField = valueConfig.field;

  let invalidCount = 0;
  let missingValueField = false;
  for (const record of data) {
    const raw = getPath(record, valueField);
    if (raw === undefined) {
      missingValueField = true;
      continue;
    }
    if (raw === null || raw === '') {
      continue;
    }
    if (toNumber(raw) === null) {
      invalidCount += 1;
    }
  }
  if (missingValueField) {
    diagnostics.push({
      code: 'missing-field',
      message: `Value field "${valueField}" is missing on at least one record.`,
      field: valueField,
    });
  }
  if (invalidCount > 0) {
    diagnostics.push({
      code: 'non-numeric-value',
      message: `${invalidCount} record(s) have a non-numeric value for "${valueField}" and were ignored.`,
      field: valueField,
      count: invalidCount,
    });
  }

  const rowTree = buildTree(
    data,
    normalized.config.rows,
    normalized.config.defaultExpandDepth ?? 1,
    diagnostics,
  );
  const columnTree = buildTree(
    data,
    normalized.config.columns,
    normalized.config.defaultExpandDepth ?? 1,
    diagnostics,
  );

  for (const root of rowTree.roots) {
    computeStates(root, data, valueField, aggregator);
  }
  for (const root of columnTree.roots) {
    computeStates(root, data, valueField, aggregator);
  }

  const defaultSort: PivotSort = { by: 'caption', direction: 'asc' };
  sortTree(rowTree.roots, normalized.config.sort?.rows ?? defaultSort, locale, valueField);
  sortTree(columnTree.roots, normalized.config.sort?.columns ?? defaultSort, locale, valueField);

  const rowLeaves = collectLeaves(rowTree.roots);
  const columnLeaves = collectLeaves(columnTree.roots);

  const cells = new Map<string, PivotCell>();
  const columnRecordSets = new Map<InternalNode, Set<number>>();
  for (const leaf of columnLeaves) {
    columnRecordSets.set(leaf, new Set(leaf.records));
  }

  for (const rowLeaf of rowLeaves) {
    const rowSet = new Set(rowLeaf.records);
    for (const columnLeaf of columnLeaves) {
      const columnSet = columnRecordSets.get(columnLeaf) as Set<number>;
      const intersection: number[] = [];
      if (rowLeaf.records.length <= columnSet.size) {
        for (const index of rowLeaf.records) {
          if (columnSet.has(index)) {
            intersection.push(index);
          }
        }
      } else {
        for (const index of columnSet) {
          if (rowSet.has(index)) {
            intersection.push(index);
          }
        }
      }

      const state = createState(aggregator);
      for (const index of intersection) {
        addRecord(state, aggregator, getPath(data[index] ?? {}, valueField));
      }
      const value = finalize(state, aggregator);
      const cell: PivotCell = {
        rowPath: rowLeaf.path,
        columnPath: columnLeaf.path,
        field: valueField,
        value,
        counts: state.records,
        formatted: formatValue(value, valueConfig, locale, emptyText),
      };
      applyRules(cell, normalized.config.conditionalRules, false, diagnostics);
      cells.set(cellKey(rowLeaf.key, columnLeaf.key, valueField), cell);
    }
  }

  const rowTotals = new Map<string, PivotCell>();
  if (normalized.config.showRowTotals) {
    for (const rowLeaf of rowLeaves) {
      const state = rowLeaf.state ?? createState(aggregator);
      const value = finalize(state, aggregator);
      const cell: PivotCell = {
        rowPath: rowLeaf.path,
        columnPath: [],
        field: valueField,
        value,
        counts: state.records,
        formatted: formatValue(value, valueConfig, locale, emptyText),
      };
      applyRules(cell, normalized.config.conditionalRules, true, diagnostics);
      rowTotals.set(cellKey(rowLeaf.key, '', valueField), cell);
    }
  }

  const columnTotals = new Map<string, PivotCell>();
  if (normalized.config.showColumnTotals) {
    for (const columnLeaf of columnLeaves) {
      const state = columnLeaf.state ?? createState(aggregator);
      const value = finalize(state, aggregator);
      const cell: PivotCell = {
        rowPath: [],
        columnPath: columnLeaf.path,
        field: valueField,
        value,
        counts: state.records,
        formatted: formatValue(value, valueConfig, locale, emptyText),
      };
      applyRules(cell, normalized.config.conditionalRules, true, diagnostics);
      columnTotals.set(cellKey('', columnLeaf.key, valueField), cell);
    }
  }

  let grandTotal: PivotCell | null = null;
  if (normalized.config.showGrandTotal) {
    const state = createState(aggregator);
    for (const record of data) {
      addRecord(state, aggregator, getPath(record, valueField));
    }
    const value = finalize(state, aggregator);
    grandTotal = {
      rowPath: [],
      columnPath: [],
      field: valueField,
      value,
      counts: state.records,
      formatted: formatValue(value, valueConfig, locale, emptyText),
    };
    applyRules(grandTotal, normalized.config.conditionalRules, true, diagnostics);
  }

  const result: PivotResult = {
    rowTree: rowTree.roots.map(toPublicNode),
    columnTree: columnTree.roots.map(toPublicNode),
    rows: rowLeaves.map(toPublicNode),
    columns: columnLeaves.map(toPublicNode),
    cells,
    rowTotals,
    columnTotals,
    grandTotal,
    diagnostics,
    config: normalized.config,
  };

  if (normalized.config.strict && diagnostics.length > 0) {
    throw new PivotError(diagnostics);
  }

  return result;
}

/** Thrown by `buildPivot` when `config.strict` is enabled and diagnostics exist. */
export class PivotError extends Error {
  constructor(public readonly diagnostics: PivotDiagnostic[]) {
    super(`pivot-grid: ${diagnostics.map((diagnostic) => diagnostic.message).join(' ')}`);
    this.name = 'PivotError';
  }
}
