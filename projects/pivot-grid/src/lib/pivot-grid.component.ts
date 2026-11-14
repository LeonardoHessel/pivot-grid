import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { buildPivot, cellKey } from './core/build-pivot';
import { toCsv } from './core/csv';
import { toXlsx } from './core/xlsx';
import type {
  CsvExportOptions,
  XlsxExportOptions,
  PivotCell,
  PivotCellEvent,
  PivotConfig,
  PivotData,
  PivotExpandEvent,
  PivotHeaderEvent,
  PivotLabels,
  PivotNode,
  PivotSort,
  PivotState,
} from './core/types';

const DEFAULT_LABELS: PivotLabels = {
  grandTotal: 'Grand total',
  rowTotal: 'Total',
  columnTotal: 'Total',
  empty: '',
  noData: 'No data',
  loading: 'Loading…',
  expand: 'Expand',
  collapse: 'Collapse',
  export: 'Export',
};

interface Entry {
  node: PivotNode;
  ancestors: PivotNode[];
  collapsed: boolean;
}

interface HeaderCell {
  node: PivotNode;
  rowspan: number;
  colspan: number;
  render: boolean;
}

interface ColumnHeaderCell {
  node: PivotNode;
  colspan: number;
}

function toCssSize(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

@Component({
  selector: 'pg-pivot-grid',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pivot-grid.component.html',
  styleUrl: './pivot-grid.component.scss',
})
export class PivotGridComponent {
  readonly data = input<PivotData>([]);
  readonly config = input.required<PivotConfig>();
  readonly state = input<PivotState | null>(null);
  readonly loading = input(false);
  readonly stickyHeaders = input(true);
  readonly stickyRowHeaders = input(true);
  readonly density = input<'compact' | 'default' | 'comfortable'>('default');
  readonly labels = input<Partial<PivotLabels>>({});
  readonly width = input<string | number>('100%');
  readonly height = input<string | number>('100%');

  readonly cellClick = output<PivotCellEvent>();
  readonly headerClick = output<PivotHeaderEvent>();
  readonly expandChange = output<PivotExpandEvent>();
  readonly sortChange = output<{ rows?: PivotSort; columns?: PivotSort }>();
  readonly stateChange = output<PivotState>();
  readonly exportComplete = output<{ format: 'csv' | 'xlsx'; filename: string }>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly internalExpanded = signal<Record<string, boolean>>({});

  constructor() {
    effect(() => {
      const state = this.state();
      if (state) {
        this.internalExpanded.set(state.expanded ?? {});
      }
    });
  }

  readonly result = computed(() => buildPivot(this.data(), this.config()));

  readonly resolvedLabels = computed<PivotLabels>(() => ({
    ...DEFAULT_LABELS,
    ...this.labels(),
  }));

  readonly values = computed(() => this.config().values);

  readonly rowFieldCount = computed(() => Math.max(1, this.config().rows.length));

  readonly rowHeaderWidths = computed<number[]>(() =>
    this.config().rows.map((row) => (typeof row.width === 'number' ? row.width : 160)),
  );

  readonly rowHeaderLefts = computed<number[]>(() => {
    const lefts: number[] = [];
    let left = 0;
    for (const width of this.rowHeaderWidths()) {
      lefts.push(left);
      left += width;
    }
    return lefts;
  });

  readonly rowHeaderTotalWidth = computed(() =>
    this.rowHeaderWidths().reduce((total, width) => total + width, 0),
  );
  readonly columnDepth = computed(() => this.config().columns.length);
  readonly headerRowCount = computed(() => this.columnDepth() + 1);
  readonly showRowTotals = computed(() => Boolean(this.config().showRowTotals));
  readonly showColumnTotals = computed(() => Boolean(this.config().showColumnTotals));
  readonly showGrandTotal = computed(() => Boolean(this.config().showGrandTotal));

  readonly sizeStyle = computed(() => ({
    width: toCssSize(this.width()),
    height: toCssSize(this.height()),
  }));

  private readonly expandedMap = computed(
    () => this.state()?.expanded ?? this.internalExpanded(),
  );

  readonly entries = computed<Entry[]>(() => {
    const expanded = this.expandedMap();
    const entries: Entry[] = [];
    const walk = (nodes: PivotNode[], ancestors: PivotNode[]): void => {
      for (const node of nodes) {
        const isLeaf = node.children.length === 0;
        const isExpanded = expanded[node.key] ?? node.expanded;
        if (isLeaf) {
          entries.push({ node, ancestors, collapsed: false });
        } else if (isExpanded) {
          walk(node.children, [...ancestors, node]);
        } else {
          entries.push({ node, ancestors, collapsed: true });
        }
      }
    };
    walk(this.result().rowTree, []);
    return entries;
  });

  readonly rowHeaderMatrix = computed<(HeaderCell | null)[][]>(() => {
    const entries = this.entries();
    const depth = this.rowFieldCount();
    const matrix: (HeaderCell | null)[][] = entries.map(() =>
      new Array<HeaderCell | null>(depth).fill(null),
    );

    for (let level = 0; level < depth; level += 1) {
      let index = 0;
      while (index < entries.length) {
        const node = this.rowNodeAtLevel(entries[index], level);
        let end = index + 1;
        while (
          end < entries.length &&
          this.rowNodeAtLevel(entries[end], level)?.key === node?.key
        ) {
          end += 1;
        }
        if (node) {
          const ownCell = entries[index].node === node;
          matrix[index][level] = {
            node,
            rowspan: end - index,
            colspan: ownCell && entries[index].collapsed ? depth - level : 1,
            render: true,
          };
          for (let skipped = index + 1; skipped < end; skipped += 1) {
            matrix[skipped][level] = {
              node,
              rowspan: 0,
              colspan: 1,
              render: false,
            };
          }
        }
        index = end;
      }
    }
    return matrix;
  });

  private readonly columnChains = computed<Map<string, PivotNode[]>>(() => {
    const chains = new Map<string, PivotNode[]>();
    const walk = (nodes: PivotNode[], ancestors: PivotNode[]): void => {
      for (const node of nodes) {
        const chain = [...ancestors, node];
        if (node.children.length === 0) {
          chains.set(node.key, chain);
        } else {
          walk(node.children, chain);
        }
      }
    };
    walk(this.result().columnTree, []);
    return chains;
  });

  readonly columnHeaderRows = computed<ColumnHeaderCell[][]>(() => {
    const depth = this.columnDepth();
    const leaves = this.result().columns;
    const rows: ColumnHeaderCell[][] = [];

    for (let level = 0; level < depth; level += 1) {
      const cells: ColumnHeaderCell[] = [];
      let index = 0;
      while (index < leaves.length) {
        const node = this.columnChains().get(leaves[index].key)?.[level];
        let end = index + 1;
        while (
          end < leaves.length &&
          this.columnChains().get(leaves[end].key)?.[level]?.key === node?.key
        ) {
          end += 1;
        }
        if (node) {
          cells.push({ node, colspan: end - index });
        }
        index = end;
      }
      rows.push(cells);
    }
    return rows;
  });

  private rowNodeAtLevel(entry: Entry, level: number): PivotNode | null {
    if (level < entry.ancestors.length) {
      return entry.ancestors[level];
    }
    return level === entry.node.level ? entry.node : null;
  }

  cellFor(entry: Entry, column: PivotNode, field: string): PivotCell | undefined {
    const key = cellKey(entry.node.key, column.key, field);
    return entry.collapsed
      ? this.result().nodeCells.get(key)
      : this.result().cells.get(key);
  }

  rowTotalFor(entry: Entry, field: string): PivotCell | undefined {
    return this.result().rowTotals.get(cellKey(entry.node.key, '', field));
  }

  columnTotalFor(column: PivotNode, field: string): PivotCell | undefined {
    return this.result().columnTotals.get(cellKey('', column.key, field));
  }

  grandTotalFor(field: string): PivotCell | undefined {
    return this.result().grandTotals.get(field);
  }

  isExpanded(node: PivotNode): boolean {
    return this.expandedMap()[node.key] ?? node.expanded;
  }

  toggle(node: PivotNode, event: Event): void {
    event.stopPropagation();
    const expanded = !this.isExpanded(node);
    const next = { ...this.expandedMap(), [node.key]: expanded };
    this.internalExpanded.set(next);
    this.expandChange.emit({ axis: 'row', path: node.path, expanded });
    this.emitState(next);
  }

  expandAll(): void {
    const next: Record<string, boolean> = {};
    const walk = (nodes: PivotNode[]): void => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          next[node.key] = true;
          walk(node.children);
        }
      }
    };
    walk(this.result().rowTree);
    this.internalExpanded.set(next);
    this.emitState(next);
  }

  collapseAll(): void {
    const next: Record<string, boolean> = {};
    const walk = (nodes: PivotNode[]): void => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          next[node.key] = false;
          walk(node.children);
        }
      }
    };
    walk(this.result().rowTree);
    this.internalExpanded.set(next);
    this.emitState(next);
  }

  getState(): PivotState {
    return { expanded: { ...this.expandedMap() }, sort: this.config().sort };
  }

  setState(state: PivotState): void {
    this.internalExpanded.set(state.expanded ?? {});
    this.stateChange.emit(this.getState());
  }

  onKeydown(event: KeyboardEvent): void {
    const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>('td[data-r]');
    if (!cell) {
      return;
    }
    const row = Number(cell.dataset['r']);
    const column = Number(cell.dataset['c']);
    const maxRow = this.entries().length - 1;
    const maxColumn = this.result().columns.length - 1;
    let nextRow = row;
    let nextColumn = column;

    switch (event.key) {
      case 'ArrowRight':
        nextColumn = Math.min(maxColumn, column + 1);
        break;
      case 'ArrowLeft':
        nextColumn = Math.max(0, column - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(maxRow, row + 1);
        break;
      case 'ArrowUp':
        nextRow = Math.max(0, row - 1);
        break;
      case 'Home':
        nextColumn = 0;
        break;
      case 'End':
        nextColumn = maxColumn;
        break;
      case 'PageDown':
        nextRow = Math.min(maxRow, row + 10);
        break;
      case 'PageUp':
        nextRow = Math.max(0, row - 10);
        break;
      default:
        return;
    }

    event.preventDefault();
    this.focusCell(nextRow, nextColumn);
  }

  private focusCell(row: number, column: number): void {
    const table = this.host.nativeElement.querySelector('table') as HTMLElement | null;
    if (!table) {
      return;
    }
    const target = table.querySelector(
      `td[data-r="${row}"][data-c="${column}"]`,
    ) as HTMLElement | null;
    if (!target) {
      return;
    }
    const cells = table.querySelectorAll('td[tabindex]') as NodeListOf<HTMLElement>;
    cells.forEach((cell: HTMLElement) => {
      cell.setAttribute('tabindex', '-1');
    });
    target.setAttribute('tabindex', '0');
    target.focus();
  }

  onCellClick(
    entry: Entry,
    column: PivotNode,
    cell: PivotCell | undefined,
    event: MouseEvent | KeyboardEvent,
  ): void {
    if (!cell) {
      return;
    }
    this.cellClick.emit({
      rowPath: entry.node.path,
      columnPath: column.path,
      field: cell.field,
      value: cell.value,
      formatted: cell.formatted,
      cell,
      event,
    });
  }

  onHeaderClick(
    axis: 'row' | 'column',
    node: PivotNode,
    event: MouseEvent,
  ): void {
    this.headerClick.emit({ axis, path: node.path, field: node.field, event });
  }

  exportCsv(options: CsvExportOptions = {}): void {
    const csv = toCsv(this.result(), options);
    const filename = options.filename ?? 'pivot.csv';
    if (typeof document === 'undefined') {
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    this.exportComplete.emit({ format: 'csv', filename });
  }

  exportExcel(options: XlsxExportOptions = {}): void {
    const bytes = toXlsx(this.result(), options);
    const filename = options.filename ?? 'pivot.xlsx';
    if (typeof document === 'undefined') {
      return;
    }
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    this.exportComplete.emit({ format: 'xlsx', filename });
  }

  refresh(): void {
    // Inputs are signals: changing data/config rebuilds the result.
  }

  private emitState(expanded: Record<string, boolean>): void {
    this.stateChange.emit({ expanded: { ...expanded }, sort: this.config().sort });
  }
}


