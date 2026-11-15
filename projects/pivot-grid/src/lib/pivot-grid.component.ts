import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  OnDestroy,
  TemplateRef,
  viewChild,
  signal,
} from '@angular/core';
import { buildPivot, cellKey } from './core/build-pivot';
import { toCsv } from './core/csv';
import { toXlsx } from './core/xlsx';
import { getPath } from './core/util';
import { toKey } from './core/util';
import type {
  CsvExportOptions,
  XlsxExportOptions,
  PivotCell,
  PivotCellDetailsContext,
  PivotCellEvent,
  PivotCellTemplateContext,
  PivotHeaderTemplateContext,
  PivotConfig,
  PivotData,
  PivotExpandEvent,
  PivotExportRow,
  PivotFilter,
  PivotField,
  PivotHeaderEvent,
  PivotLabels,
  PivotNode,
  PivotRowHeaderLayout,
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
  clearFilters: 'Clear filters',
  resizeColumn: 'Resize column',
  resetColumnWidth: 'Reset column width',
  detailsTitle: 'Cell details',
  detailsClose: 'Close',
  detailsEmpty: 'No records for this cell.',
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
  imports: [NgClass, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pivot-grid.component.html',
  styleUrl: './pivot-grid.component.scss',
})
export class PivotGridComponent implements AfterViewInit, OnDestroy {
  readonly data = input<PivotData>([]);
  readonly config = input.required<PivotConfig>();
  readonly state = input<PivotState | null>(null);
  readonly loading = input(false);
  readonly stickyHeaders = input(true);
  readonly stickyRowHeaders = input(true);
  readonly virtualScroll = input(false);
  readonly rowHeight = input(32);
  readonly virtualOverscan = input(5);
  readonly density = input<'compact' | 'default' | 'comfortable'>('default');
  readonly labels = input<Partial<PivotLabels>>({});
  readonly width = input<string | number>('100%');
  readonly height = input<string | number>('100%');
  readonly rowHeaderLayout = input<PivotRowHeaderLayout>('columns');
  readonly indentSize = input(16);
  readonly rowHeaderWidth = input(200);
  readonly showValueHeader = input(true);
  readonly cellDetails = input(false);
  readonly detailsColumns = input<PivotField[] | string[]>([]);
  readonly detailsTemplate = input<TemplateRef<PivotCellDetailsContext> | null>(null);

  readonly cellClick = output<PivotCellEvent>();
  readonly headerClick = output<PivotHeaderEvent>();
  readonly expandChange = output<PivotExpandEvent>();
  readonly sortChange = output<{ rows?: PivotSort; columns?: PivotSort }>();
  readonly stateChange = output<PivotState>();
  readonly columnStateChange = output<Record<string, number>>();
  readonly cellDetailsOpen = output<PivotCellDetailsContext>();
  readonly cellDetailsClose = output<void>();
  readonly filters = input<PivotFilter[] | null>(null);
  readonly minColumnWidth = input(60);
  readonly maxColumnWidth = input(600);
  readonly cellTemplate = input<TemplateRef<PivotCellTemplateContext> | null>(null);
  readonly headerTemplate = input<TemplateRef<PivotHeaderTemplateContext> | null>(null);
  readonly filtersChange = output<PivotFilter[]>();
  readonly exportComplete = output<{ format: 'csv' | 'xlsx'; filename: string }>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly internalExpanded = signal<Record<string, boolean>>({});
  private readonly internalFilters = signal<PivotFilter[]>([]);
  private readonly internalColumnWidths = signal<Record<string, number>>({});
  private readonly details = signal<PivotCellDetailsContext | null>(null);
  readonly detailsContext = this.details.asReadonly();
  readonly detailsDialog = viewChild<ElementRef<HTMLElement>>('detailsDialog');
  private detailsTrigger: HTMLElement | null = null;
  private filtersInitialized = false;
  private readonly scrollTop = signal(0);
  private readonly viewportHeight = signal(0);
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      const state = this.state();
      if (state) {
        this.internalExpanded.set(state.expanded ?? {});
      }
    });

    effect(() => {
      const configFilters = this.config().filters ?? [];
      if (!this.filtersInitialized) {
        this.internalFilters.set(configFilters);
        this.filtersInitialized = true;
      }
    });
  }

  ngAfterViewInit(): void {
    const scroller = this.scroller();
    if (!scroller) {
      return;
    }
    this.viewportHeight.set(scroller.clientHeight);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.viewportHeight.set(scroller.clientHeight);
      });
      this.resizeObserver.observe(scroller);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private scroller(): HTMLElement | null {
    return this.host.nativeElement.querySelector('.pg-scroll') as HTMLElement | null;
  }

  onScroll(event: Event): void {
    this.scrollTop.set((event.target as HTMLElement).scrollTop);
  }


  readonly effectiveFilters = computed(
    () => this.filters() ?? this.internalFilters(),
  );

  readonly result = computed(() => {
    const base = buildPivot(this.data(), {
      ...this.config(),
      filters: this.effectiveFilters(),
    });
    if (!this.showValueHeader() && this.values().length > 1) {
      return {
        ...base,
        diagnostics: [
          ...base.diagnostics,
          {
            code: 'ignored-option' as const,
            message:
              'showValueHeader=false was ignored: multiple measures require the value header.',
          },
        ],
      };
    }
    return base;
  });

  readonly resolvedLabels = computed<PivotLabels>(() => ({
    ...DEFAULT_LABELS,
    ...this.labels(),
  }));

  readonly values = computed(() => this.config().values);

  readonly treeMode = computed(() => this.rowHeaderLayout() === 'tree');

  readonly rowFieldCount = computed(() =>
    this.treeMode() ? 1 : Math.max(1, this.config().rows.length),
  );

  readonly rowHeaderWidths = computed<number[]>(() =>
    this.treeMode()
      ? [this.rowHeaderWidth()]
      : this.config().rows.map((row) =>
          typeof row.width === 'number' ? row.width : 160,
        ),
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

  readonly treeHeaderWidth = computed(() =>
    this.rowHeaderWidth() === 200 ? null : this.rowHeaderWidth(),
  );

  readonly rowHeaderTotalWidth = computed<number | null>(() =>
    this.treeMode()
      ? this.treeHeaderWidth()
      : this.rowHeaderWidths().reduce((total, width) => total + width, 0),
  );
  readonly columnDepth = computed(() => this.config().columns.length);
  readonly showValueHeaderRow = computed(
    () =>
      this.showValueHeader() ||
      this.values().length > 1 ||
      this.columnDepth() === 0,
  );
  readonly headerRowCount = computed(
    () => this.columnDepth() + (this.showValueHeaderRow() ? 1 : 0),
  );
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

  readonly treeRows = computed<{ node: PivotNode; level: number }[]>(() => {
    const expanded = this.expandedMap();
    const rows: { node: PivotNode; level: number }[] = [];
    const walk = (nodes: PivotNode[], level: number): void => {
      for (const node of nodes) {
        rows.push({ node, level });
        if (node.children.length > 0 && (expanded[node.key] ?? node.expanded)) {
          walk(node.children, level + 1);
        }
      }
    };
    walk(this.result().rowTree, 0);
    return rows;
  });

  readonly displayRowCount = computed(() =>
    this.treeMode() ? this.treeRows().length : this.entries().length,
  );

  readonly virtualStart = computed(() => {
    if (!this.virtualScroll()) {
      return 0;
    }
    const height = Math.max(1, this.rowHeight());
    return Math.max(0, Math.floor(this.scrollTop() / height) - this.virtualOverscan());
  });

  readonly viewportSize = computed(() => {
    const raw = this.height();
    if (typeof raw === 'number') {
      return raw;
    }
    const match = /^(\d+(?:\.\d+)?)px$/.exec(raw.trim());
    return match ? Number(match[1]) : this.viewportHeight();
  });

  readonly virtualEnd = computed(() => {
    const total = this.displayRowCount();
    if (!this.virtualScroll()) {
      return total;
    }
    const height = Math.max(1, this.rowHeight());
    const windowSize =
      Math.ceil(Math.max(this.viewportSize(), height) / height) +
      this.virtualOverscan() * 2 +
      1;
    return Math.min(total, this.virtualStart() + windowSize);
  });

  readonly renderedEntries = computed(() =>
    this.entries()
      .slice(this.virtualStart(), this.virtualEnd())
      .map((entry, index) => ({ entry, rowIndex: this.virtualStart() + index })),
  );

  readonly renderedTreeRows = computed(() =>
    this.treeRows()
      .slice(this.virtualStart(), this.virtualEnd())
      .map((row, index) => ({
        ...row,
        rowIndex: this.virtualStart() + index,
      })),
  );

  readonly topSpacerHeight = computed(() =>
    this.virtualScroll() ? this.virtualStart() * this.rowHeight() : 0,
  );

  readonly bottomSpacerHeight = computed(() =>
    this.virtualScroll()
      ? (this.displayRowCount() - this.virtualEnd()) * this.rowHeight()
      : 0,
  );

  readonly columnCount = computed(
    () =>
      this.rowFieldCount() +
      this.result().columns.length * this.values().length +
      (this.showRowTotals() ? this.values().length : 0),
  );

  rowHeaderNodes(entry: Entry): (PivotNode | null)[] {
    const nodes: (PivotNode | null)[] = [];
    for (let level = 0; level < this.rowFieldCount(); level += 1) {
      if (level < entry.ancestors.length) {
        nodes.push(entry.ancestors[level]);
      } else if (level === entry.node.level) {
        nodes.push(entry.node);
      } else {
        nodes.push(null);
      }
    }
    return nodes;
  }

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

  treeCellFor(
    node: PivotNode,
    column: PivotNode,
    field: string,
  ): PivotCell | undefined {
    const source =
      node.children.length > 0 ? this.result().nodeCells : this.result().cells;
    return source.get(cellKey(node.key, column.key, field));
  }

  treeRowTotalFor(node: PivotNode, field: string): PivotCell | undefined {
    return this.result().rowTotals.get(cellKey(node.key, '', field));
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
    const columns = { ...this.columnWidths() };
    return {
      expanded: { ...this.expandedMap() },
      sort: this.config().sort,
      ...(Object.keys(columns).length > 0 ? { columns } : {}),
    };
  }

  setState(state: PivotState): void {
    this.internalExpanded.set(state.expanded ?? {});
    this.internalColumnWidths.set(state.columns ?? {});
    this.stateChange.emit(this.getState());
  }

  onKeydown(event: KeyboardEvent): void {
    const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>('td[data-r]');
    if (!cell) {
      return;
    }
    const row = Number(cell.dataset['r']);
    const column = Number(cell.dataset['c']);
    const maxRow = this.displayRowCount() - 1;
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
      case 'Enter':
      case ' ': {
        const hit = this.cellAt(row, column);
        if (hit && this.cellDetails()) {
          event.preventDefault();
          this.openCellDetails(hit.cell, cell);
        }
        return;
      }
      default:
        return;
    }

    event.preventDefault();
    this.focusCell(nextRow, nextColumn);
  }

  private focusCell(row: number, column: number, retry = true): void {
    const table = this.host.nativeElement.querySelector('table') as HTMLElement | null;
    if (!table) {
      return;
    }
    const target = table.querySelector(
      `td[data-r="${row}"][data-c="${column}"]`,
    ) as HTMLElement | null;
    if (!target) {
      const scroller = this.scroller();
      if (retry && this.virtualScroll() && scroller) {
        scroller.scrollTop = Math.max(0, row * this.rowHeight() - this.rowHeight());
        this.scrollTop.set(scroller.scrollTop);
        setTimeout(() => this.focusCell(row, column, false), 0);
      }
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
    entry: Entry | PivotNode,
    column: PivotNode,
    cell: PivotCell | undefined,
    event: MouseEvent | KeyboardEvent,
  ): void {
    if (!cell) {
      return;
    }
    const rowNode = 'node' in entry ? entry.node : entry;
    this.cellClick.emit({
      rowPath: rowNode.path,
      columnPath: column.path,
      field: cell.field,
      value: cell.value,
      formatted: cell.formatted,
      cell,
      event,
    });
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('td');
    this.openCellDetails(cell, target ?? null);
  }

  onHeaderClick(
    axis: 'row' | 'column',
    node: PivotNode,
    event: MouseEvent,
  ): void {
    this.headerClick.emit({ axis, path: node.path, field: node.field, event });
  }

  readonly filterFields = computed(() =>
    [...this.config().rows, ...this.config().columns].filter(
      (field) => field.filterable,
    ),
  );

  readonly filterOptions = computed(() =>
    this.filterFields().map((field) => {
      const seen = new Set<string>();
      for (const record of this.data()) {
        const value = toKey(getPath(record, field.field));
        if (value !== '') {
          seen.add(value);
        }
      }
      const values = Array.from(seen)
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
        .slice(0, 500);
      return {
        field: field.field,
        caption: field.caption ?? field.field,
        values,
      };
    }),
  );

  isFilterValueSelected(field: string, value: string): boolean {
    return (
      this.effectiveFilters()
        .find((filter) => filter.field === field)
        ?.values.includes(value) ?? false
    );
  }

  onFilterChange(field: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const values = Array.from(select.selectedOptions).map((option) => option.value);
    const next = this.effectiveFilters().filter(
      (filter) => filter.field !== field && filter.values.length > 0,
    );
    if (values.length > 0) {
      next.push({ field, values });
    }
    this.applyFilters(next);
  }

  clearFilters(): void {
    this.applyFilters([]);
  }

  private applyFilters(next: PivotFilter[]): void {
    this.internalFilters.set(next);
    this.filtersChange.emit(next);
  }
  cellContext(
    rowPath: string[],
    columnPath: string[],
    field: string,
    cell: PivotCell,
  ): PivotCellTemplateContext {
    return {
      $implicit: cell,
      rowPath,
      columnPath,
      field,
      value: cell.value,
      formatted: cell.formatted,
      cell,
    };
  }

  headerContext(
    axis: 'row' | 'column',
    node: PivotNode,
  ): PivotHeaderTemplateContext {
    return {
      $implicit: node,
      axis,
      path: node.path,
      field: node.field,
      label: node.caption,
      node,
    };
  }
  readonly columnWidths = computed(
    () => this.state()?.columns ?? this.internalColumnWidths(),
  );

  readonly hasColumnWidths = computed(
    () => Object.keys(this.columnWidths()).length > 0,
  );

  columnWidth(key: string): number | null {
    return this.columnWidths()[key] ?? null;
  }

  startResize(event: PointerEvent, key: string): void {
    event.preventDefault();
    if (typeof document === 'undefined') {
      return;
    }
    const handle = event.target as HTMLElement;
    const header = handle.closest('th') as HTMLElement | null;
    const startWidth = this.columnWidth(key) ?? header?.offsetWidth ?? 120;
    const startX = event.clientX;

    const move = (moveEvent: PointerEvent): void => {
      this.setColumnWidth(
        key,
        startWidth + (moveEvent.clientX - startX),
        false,
      );
    };
    const up = (): void => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      this.emitColumnState();
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up, { once: true });
  }

  onResizeKeydown(event: KeyboardEvent, key: string): void {
    const current = this.columnWidth(key) ?? 120;
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        next = current + 10;
        break;
      case 'ArrowLeft':
        next = current - 10;
        break;
      case 'Home':
        this.resetColumnWidth(key);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    this.setColumnWidth(key, next, true);
  }

  resetColumnWidth(key: string): void {
    const next = { ...this.columnWidths() };
    delete next[key];
    this.internalColumnWidths.set(next);
    this.emitColumnState();
  }

  private setColumnWidth(key: string, width: number, emit: boolean): void {
    const clamped = Math.min(
      Math.max(width, this.minColumnWidth()),
      Math.max(this.minColumnWidth(), this.maxColumnWidth()),
    );
    this.internalColumnWidths.set({
      ...this.columnWidths(),
      [key]: Math.round(clamped),
    });
    if (emit) {
      this.emitColumnState();
    }
  }

  private emitColumnState(): void {
    const widths = { ...this.columnWidths() };
    this.columnStateChange.emit(widths);
    this.stateChange.emit(this.getState());
  }

  readonly detailsColumnsResolved = computed(() => {
    const configured = this.detailsColumns();
    if (configured.length > 0) {
      return configured.map((column) =>
        typeof column === 'string'
          ? { field: column, caption: column }
          : { field: column.field, caption: column.caption ?? column.field },
      );
    }
    const first = this.details()?.records[0];
    return first
      ? Object.keys(first).map((field) => ({ field, caption: field }))
      : [];
  });

  detailsValue(record: Record<string, unknown>, field: string): string {
    const value = getPath(record, field);
    if (value === null || value === undefined) {
      return '';
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  openCellDetails(cell: PivotCell, trigger: HTMLElement | null): void {
    if (!this.cellDetails()) {
      return;
    }
    const context: PivotCellDetailsContext = {
      cell,
      rowPath: cell.rowPath,
      columnPath: cell.columnPath,
      field: cell.field,
      value: cell.value,
      formatted: cell.formatted,
      records: this.result().recordsForCell(cell.rowPath, cell.columnPath),
    };
    this.detailsTrigger = trigger;
    this.details.set(context);
    this.cellDetailsOpen.emit(context);
    setTimeout(() => this.focusDetailsDialog());
  }

  closeCellDetails(): void {
    if (!this.details()) {
      return;
    }
    this.details.set(null);
    this.cellDetailsClose.emit();
    const trigger = this.detailsTrigger;
    this.detailsTrigger = null;
    setTimeout(() => trigger?.focus());
  }

  onDetailsBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCellDetails();
    }
  }

  onDetailsKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCellDetails();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const dialog = this.detailsDialog()?.nativeElement;
    if (!dialog) {
      return;
    }
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusDetailsDialog(): void {
    const dialog = this.detailsDialog()?.nativeElement;
    if (!dialog) {
      return;
    }
    const target = dialog.querySelector<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])');
    (target ?? dialog).focus();
  }

  private cellAt(
    rowIndex: number,
    columnIndex: number,
  ): { cell: PivotCell; node: PivotNode } | null {
    const columns = this.result().columns;
    const values = this.values();
    if (columns.length === 0 || values.length === 0) {
      return null;
    }
    const column = columns[Math.floor(columnIndex / values.length)];
    const value = values[columnIndex % values.length];
    if (!column || !value) {
      return null;
    }
    if (this.treeMode()) {
      const row = this.treeRows()[rowIndex];
      const cell = row ? this.treeCellFor(row.node, column, value.field) : undefined;
      return row && cell ? { cell, node: row.node } : null;
    }
    const entry = this.entries()[rowIndex];
    const cell = entry ? this.cellFor(entry, column, value.field) : undefined;
    return entry && cell ? { cell, node: entry.node } : null;
  }

  exportRows(): PivotExportRow[] {
    return this.entries().map((entry) => ({
      key: entry.node.key,
      path: entry.node.path,
      collapsed: entry.collapsed,
    }));
  }

  private withVisibleRows<T extends CsvExportOptions | XlsxExportOptions>(options: T): T {
    if (options.mode !== 'visible' || options.rows) {
      return options;
    }
    return { ...options, rows: this.exportRows() };
  }

  exportCsv(options: CsvExportOptions = {}): void {
    const csv = toCsv(this.result(), this.withVisibleRows(options));
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
    const bytes = toXlsx(this.result(), this.withVisibleRows(options));
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

  private emitState(expanded: Record<string, boolean>): void {
    this.stateChange.emit({ expanded: { ...expanded }, sort: this.config().sort });
  }
}












