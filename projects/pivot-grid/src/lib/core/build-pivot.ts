import {
  Aggregator,
  ConditionalRule,
  PivotAuxiliaryValue,
  PivotCell,
  PivotConfig,
  PivotData,
  PivotDiagnostic,
  PivotField,
  PivotNode,
  PivotResult,
  PivotSort,
  PivotValueField,
} from './types';
import { AggState, addRecord, createState, finalize } from './aggregate';
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

      // Every node keeps its record indexes so collapsed subtrees can be
      // aggregated per column without re-walking the tree.
      node.records.push(index);
    });
  });

  return { roots, leaves };
}

function aggregateRecords(
  data: PivotData,
  indexes: readonly number[],
  values: PivotValueField[],
): Record<string, number | null> {
  const aggregates: Record<string, number | null> = {};
  for (const value of values) {
    const aggregator: Aggregator = value.aggregator ?? 'sum';
    const state = createState(aggregator);
    for (const index of indexes) {
      addRecord(state, aggregator, getPath(data[index] ?? {}, value.field));
    }
    aggregates[value.field] = finalize(state, aggregator);
  }
  return aggregates;
}

function computeAggregates(
  node: InternalNode,
  data: PivotData,
  values: PivotValueField[],
): void {
  node.aggregates = aggregateRecords(data, node.records, values);
  for (const child of node.children.values()) {
    computeAggregates(child, data, values);
  }
}

function sortNodes(
  nodes: InternalNode[],
  sort: PivotSort | undefined,
  locale: string,
  values: PivotValueField[],
): void {
  if (!sort) {
    return;
  }
  const sign = (sort.direction ?? 'asc') === 'desc' ? -1 : 1;
  const byValue = sort.by === 'value';
  const sortField = sort.field ?? values[0]?.field ?? '';

  const decorated = nodes.map((node, index) => ({ node, index }));
  decorated.sort((left, right) => {
    let result: number;
    if (byValue) {
      const leftValue = left.node.aggregates[sortField] ?? null;
      const rightValue = right.node.aggregates[sortField] ?? null;
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
  values: PivotValueField[],
): void {
  sortNodes(nodes, sort, locale, values);
  for (const node of nodes) {
    sortTree(Array.from(node.children.values()), sort, locale, values);
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
  valueField: PivotValueField,
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
  const value = rule.measure
    ? cell.auxiliary?.[rule.measure] ?? null
    : cell.value;
  if (value === null) {
    return false;
  }
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

function aggregateAuxiliary(
  auxiliary: PivotAuxiliaryValue[] | undefined,
  data: PivotData,
  indexes: readonly number[],
): Record<string, number | null> | undefined {
  if (!auxiliary || auxiliary.length === 0) {
    return undefined;
  }
  const result: Record<string, number | null> = {};
  for (const entry of auxiliary) {
    const aggregator: Aggregator = entry.aggregator ?? 'sum';
    const state = createState(aggregator);
    for (const index of indexes) {
      addRecord(state, aggregator, getPath(data[index] ?? {}, entry.field));
    }
    result[entry.field] = finalize(state, aggregator);
  }
  return result;
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
  nodeCells: new Map(),
  rowTotals: new Map(),
  columnTotals: new Map(),
  grandTotals: new Map(),
  diagnostics,
  config,
});

export function buildPivot(data: PivotData, config: PivotConfig): PivotResult {
  const normalized = normalizeConfig(config);
  const { locale, emptyText, diagnostics } = normalized;

  if (!normalized.valid) {
    if (normalized.config.strict && diagnostics.length > 0) {
      throw new PivotError(diagnostics);
    }
    return emptyResult(normalized.config, diagnostics);
  }

  const values = normalized.config.values;

  for (const value of values) {
    let invalidCount = 0;
    let missingValueField = false;
    for (const record of data) {
      const raw = getPath(record, value.field);
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
        message: `Value field "${value.field}" is missing on at least one record.`,
        field: value.field,
      });
    }
    if (invalidCount > 0) {
      diagnostics.push({
        code: 'non-numeric-value',
        message: `${invalidCount} record(s) have a non-numeric value for "${value.field}" and were ignored.`,
        field: value.field,
        count: invalidCount,
      });
    }
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
    computeAggregates(root, data, values);
  }
  for (const root of columnTree.roots) {
    computeAggregates(root, data, values);
  }

  const defaultSort: PivotSort = { by: 'caption', direction: 'asc' };
  sortTree(rowTree.roots, normalized.config.sort?.rows ?? defaultSort, locale, values);
  sortTree(columnTree.roots, normalized.config.sort?.columns ?? defaultSort, locale, values);

  const rowLeaves = collectLeaves(rowTree.roots);
  const columnLeaves = collectLeaves(columnTree.roots);

  const allRowNodes: InternalNode[] = [];
  const collectNodes = (nodes: InternalNode[]): void => {
    for (const node of nodes) {
      allRowNodes.push(node);
      collectNodes(Array.from(node.children.values()));
    }
  };
  collectNodes(rowTree.roots);

  const cells = new Map<string, PivotCell>();
  const nodeCells = new Map<string, PivotCell>();
  const columnRecordSets = new Map<InternalNode, Set<number>>();
  for (const leaf of columnLeaves) {
    columnRecordSets.set(leaf, new Set(leaf.records));
  }

  const buildCellsFor = (
    rowNode: InternalNode,
    target: Map<string, PivotCell>,
  ): void => {
    const rowSet = new Set(rowNode.records);
    for (const columnLeaf of columnLeaves) {
      const columnSet = columnRecordSets.get(columnLeaf) as Set<number>;
      const intersection: number[] = [];
      if (rowNode.records.length <= columnSet.size) {
        for (const index of rowNode.records) {
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

      for (const value of values) {
        const aggregator: Aggregator = value.aggregator ?? 'sum';
        const state = createState(aggregator);
        for (const index of intersection) {
          addRecord(state, aggregator, getPath(data[index] ?? {}, value.field));
        }
        const cellValue = finalize(state, aggregator);
        const cell: PivotCell = {
          rowPath: rowNode.path,
          columnPath: columnLeaf.path,
          field: value.field,
          value: cellValue,
          counts: state.records,
          auxiliary: aggregateAuxiliary(normalized.config.auxiliaryValues, data, intersection),
          formatted: formatValue(cellValue, value, locale, emptyText),
        };
        applyRules(cell, normalized.config.conditionalRules, false, diagnostics);
        target.set(cellKey(rowNode.key, columnLeaf.key, value.field), cell);
      }
    }
  };

  for (const rowLeaf of rowLeaves) {
    buildCellsFor(rowLeaf, cells);
  }
  for (const node of allRowNodes) {
    if (node.children.size > 0) {
      buildCellsFor(node, nodeCells);
    }
  }

  const rowTotals = new Map<string, PivotCell>();
  if (normalized.config.showRowTotals) {
    for (const node of allRowNodes) {
      for (const value of values) {
        const aggregator: Aggregator = value.aggregator ?? 'sum';
        const state = createState(aggregator);
        for (const index of node.records) {
          addRecord(state, aggregator, getPath(data[index] ?? {}, value.field));
        }
        const cellValue = finalize(state, aggregator);
        const cell: PivotCell = {
          rowPath: node.path,
          columnPath: [],
          field: value.field,
          value: cellValue,
          counts: state.records,
          auxiliary: aggregateAuxiliary(normalized.config.auxiliaryValues, data, node.records),
          formatted: formatValue(cellValue, value, locale, emptyText),
        };
        applyRules(cell, normalized.config.conditionalRules, true, diagnostics);
        rowTotals.set(cellKey(node.key, '', value.field), cell);
      }
    }
  }

  const columnTotals = new Map<string, PivotCell>();
  if (normalized.config.showColumnTotals) {
    for (const columnLeaf of columnLeaves) {
      for (const value of values) {
        const aggregator: Aggregator = value.aggregator ?? 'sum';
        const state = createState(aggregator);
        for (const index of columnLeaf.records) {
          addRecord(state, aggregator, getPath(data[index] ?? {}, value.field));
        }
        const cellValue = finalize(state, aggregator);
        const cell: PivotCell = {
          rowPath: [],
          columnPath: columnLeaf.path,
          field: value.field,
          value: cellValue,
          counts: state.records,
          auxiliary: aggregateAuxiliary(normalized.config.auxiliaryValues, data, columnLeaf.records),
          formatted: formatValue(cellValue, value, locale, emptyText),
        };
        applyRules(cell, normalized.config.conditionalRules, true, diagnostics);
        columnTotals.set(cellKey('', columnLeaf.key, value.field), cell);
      }
    }
  }

  const grandTotals = new Map<string, PivotCell>();
  const allIndexes = data.map((_record, index) => index);
  for (const value of values) {
    const aggregator: Aggregator = value.aggregator ?? 'sum';
    const state = createState(aggregator);
    for (const index of allIndexes) {
      addRecord(state, aggregator, getPath(data[index] ?? {}, value.field));
    }
    const cellValue = finalize(state, aggregator);
    const cell: PivotCell = {
      rowPath: [],
      columnPath: [],
      field: value.field,
      value: cellValue,
      counts: state.records,
      auxiliary: aggregateAuxiliary(normalized.config.auxiliaryValues, data, allIndexes),
      formatted: formatValue(cellValue, value, locale, emptyText),
    };
    applyRules(cell, normalized.config.conditionalRules, true, diagnostics);
    grandTotals.set(value.field, cell);
  }

  if (normalized.config.strict && diagnostics.length > 0) {
    throw new PivotError(diagnostics);
  }

  return {
    rowTree: rowTree.roots.map(toPublicNode),
    columnTree: columnTree.roots.map(toPublicNode),
    rows: rowLeaves.map(toPublicNode),
    columns: columnLeaves.map(toPublicNode),
    cells,
    nodeCells,
    rowTotals,
    columnTotals,
    grandTotals,
    diagnostics,
    config: normalized.config,
  };
}

/** Thrown by `buildPivot` when `config.strict` is enabled and diagnostics exist. */
export class PivotError extends Error {
  constructor(public readonly diagnostics: PivotDiagnostic[]) {
    super(`pivot-grid: ${diagnostics.map((diagnostic) => diagnostic.message).join(' ')}`);
    this.name = 'PivotError';
  }
}

