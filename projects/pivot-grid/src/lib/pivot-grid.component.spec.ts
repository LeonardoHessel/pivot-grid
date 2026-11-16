import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PivotGridComponent } from './pivot-grid.component';
import { PivotConfig, PivotData } from './core/types';

const data: PivotData = [
  { region: 'Sul', city: 'A', month: '2026-01', amount: 100 },
  { region: 'Sul', city: 'A', month: '2026-02', amount: 50 },
  { region: 'Sul', city: 'B', month: '2026-01', amount: 25 },
  { region: 'Norte', city: 'C', month: '2026-01', amount: 30 },
];

const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região' },
    { field: 'city', caption: 'Cidade' },
  ],
  columns: [{ field: 'month', caption: 'Mês' }],
  values: [{ field: 'amount', caption: 'Total' }],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  defaultExpandDepth: 'all',
  locale: 'pt-BR',
};

@Component({
  selector: 'app-template-host',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <pg-pivot-grid
      [data]="data"
      [config]="config"
      [cellTemplate]="cellTpl"
      [headerTemplate]="headerTpl">
    </pg-pivot-grid>

    <ng-template #cellTpl let-formatted="formatted" let-value="value" let-field="field">
      <span class="custom-cell" [attr.data-field]="field">{{ formatted }}|{{ value }}</span>
    </ng-template>

    <ng-template #headerTpl let-label="label" let-axis="axis">
      <span class="custom-header" [attr.data-axis]="axis">{{ axis }}:{{ label }}</span>
    </ng-template>
  `,
})
class TemplateHostComponent {
  readonly data = data;
  readonly config = config;
}

@Component({
  selector: 'app-tree-template-host',
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <pg-pivot-grid
      [data]="data"
      [config]="config"
      rowHeaderLayout="tree"
      [headerTemplate]="headerTpl">
    </pg-pivot-grid>

    <ng-template #headerTpl let-label="label" let-axis="axis">
      <span class="tree-header" [attr.data-axis]="axis">{{ label }}</span>
    </ng-template>
  `,
})
class TreeTemplateHostComponent {
  readonly data = data;
  readonly config = config;
}

describe('PivotGridComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PivotGridComponent],
    }).compileComponents();
  });

  function create(cfg: PivotConfig = config, rows: PivotData = data) {
    const fixture = TestBed.createComponent(PivotGridComponent);
    fixture.componentRef.setInput('data', rows);
    fixture.componentRef.setInput('config', cfg);
    fixture.componentRef.setInput('labels', {
      rowTotal: 'Total',
      columnTotal: 'Total',
      grandTotal: 'Total geral',
      noData: 'Sem dados',
    });
    fixture.detectChanges();
    return fixture;
  }

  it('renders the grid with row headers, values and totals', () => {
    const fixture = create();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('table.pg-table')?.getAttribute('role')).toBe('grid');
    expect(element.querySelectorAll('th.pg-rowheader').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('td.pg-cell').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('td.pg-total').length).toBeGreaterThan(0);
  });

  it('collapses a group and emits expandChange', () => {
    const fixture = create();
    const events: boolean[] = [];
    fixture.componentInstance.expandChange.subscribe((event) => events.push(event.expanded));

    const button = fixture.nativeElement.querySelector('button.pg-expander') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();
    fixture.detectChanges();

    expect(events.length).toBe(1);
    expect(events[0]).toBeFalse();
    expect(fixture.componentInstance.entries().length).toBeLessThan(4);
  });

  it('keeps a controlled state through stateChange', () => {
    const fixture = create();
    const states: unknown[] = [];
    fixture.componentInstance.stateChange.subscribe((state) => states.push(state));

    (fixture.nativeElement.querySelector('button.pg-expander') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(states.length).toBe(1);
    expect(fixture.componentInstance.getState().expanded).toBeTruthy();
  });

  it('exports CSV through the component', () => {
    const fixture = create();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');

    fixture.componentInstance.exportCsv({ filename: 'report.csv' });

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('exports XLSX through the component', () => {
    const fixture = create();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');

    fixture.componentInstance.exportExcel({ filename: 'report.xlsx' });

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('keeps row header columns sticky with configurable widths', () => {
    const fixture = create({
      ...config,
      rows: [
        { field: 'region', caption: 'Região', width: 120 },
        { field: 'city', caption: 'Cidade', width: 180 },
      ],
    });
    const element: HTMLElement = fixture.nativeElement;
    const secondLevel = element.querySelectorAll<HTMLElement>('th.pg-level-1');

    expect(secondLevel.length).toBeGreaterThan(0);
    expect(secondLevel[0].classList).toContain('pg-sticky-col');
    expect(secondLevel[0].style.left).toBe('120px');
    expect(secondLevel[0].style.width).toBe('180px');
  });

  it('moves focus with arrow keys between data cells', () => {
    const fixture = create();
    const element: HTMLElement = fixture.nativeElement;
    const first = element.querySelector<HTMLElement>('td[data-r="0"][data-c="0"]');
    const second = element.querySelector<HTMLElement>('td[data-r="0"][data-c="1"]');

    expect(first?.getAttribute('tabindex')).toBe('0');
    first?.focus();
    first?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(second);
    expect(second?.getAttribute('tabindex')).toBe('0');
  });
  it('renders one column per measure with the measure as inner header', () => {
    const rows = data.map((row) => ({ ...row, goal: 1 }));
    const fixture = create(
      {
        ...config,
        values: [
          { field: 'amount', caption: 'Total' },
          { field: 'goal', caption: 'Meta' },
        ],
      },
      rows,
    );
    const element: HTMLElement = fixture.nativeElement;
    const headers = element.querySelectorAll<HTMLElement>('th.pg-value-header');

    expect(headers.length).toBe(4); // 2 meses x 2 medidas
    expect(Array.from(headers).map((header) => header.textContent?.trim())).toEqual([
      'Total',
      'Meta',
      'Total',
      'Meta',
    ]);
    expect(element.querySelectorAll('td.pg-cell:not(.pg-total)').length).toBe(12);
  });
  it('virtualizes rows while keeping sticky headers and spacers', () => {
    const many = Array.from({ length: 200 }, (_value, index) => ({
      group: `G${String(index).padStart(3, '0')}`,
      month: '2026-01',
      amount: index + 1,
    }));
    const fixture = create(
      {
        ...config,
        rows: [{ field: 'group', caption: 'Grupo', width: 120 }],
        columns: [{ field: 'month', caption: 'Mês' }],
        values: [{ field: 'amount', caption: 'Total' }],
      },
      many,
    );
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('height', '200px');
    fixture.componentRef.setInput('rowHeight', 30);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(fixture.componentInstance.virtualScroll()).toBeTrue();
    expect(fixture.componentInstance.renderedEntries().length).toBeLessThan(200);
    expect(element.querySelectorAll('tr.pg-row').length).toBeLessThan(200);
    expect(element.querySelectorAll('th.pg-sticky-col').length).toBeGreaterThan(0);

    const scroller = element.querySelector('.pg-scroll') as HTMLElement;
    scroller.scrollTop = 1500;
    scroller.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(element.querySelectorAll('tr.pg-spacer').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.exportRows().length).toBe(200);
  });
  it('renders the filter bar and filters by a row field', () => {
    const fixture = create({
      ...config,
      rows: [{ field: 'region', caption: 'Região', filterable: true }],
      columns: [{ field: 'month', caption: 'Mês' }],
      values: [{ field: 'amount', caption: 'Total' }],
    });
    const element: HTMLElement = fixture.nativeElement;
    const select = element.querySelector('.pg-filter-select') as HTMLSelectElement;
    const emitted: unknown[] = [];
    fixture.componentInstance.filtersChange.subscribe((filters) => emitted.push(filters));

    expect(select).toBeTruthy();
    const sul = Array.from(select.options).find((option) => option.value === 'Sul');
    expect(sul).toBeTruthy();
    if (sul) {
      sul.selected = true;
    }
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(fixture.componentInstance.entries().map((entry) => entry.node.caption)).toEqual([
      'Sul',
    ]);
  });
  it('renders custom cell and header templates', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TemplateHostComponent] });
    const fixture = TestBed.createComponent(TemplateHostComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('.custom-cell').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('.custom-header').length).toBeGreaterThan(0);
    expect(element.querySelector('.custom-header')?.getAttribute('data-axis')).toMatch(
      /row|column/,
    );
    expect(element.querySelector('.custom-cell')?.textContent).toContain('|');
  });
  it('applies persisted column widths from state', () => {
    const fixture = create();
    const key = fixture.componentInstance.result().columns[0].key;
    fixture.componentRef.setInput('state', {
      expanded: {},
      columns: { [key]: 220 },
    });
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('table')?.classList).toContain('pg-fixed');
    const widths = Array.from(
      element.querySelectorAll<HTMLElement>('th.pg-value-header'),
    ).map((header) => header.style.width);
    expect(widths).toContain('220px');
  });

  it('resizes with the keyboard and resets on double click', () => {
    const fixture = create();
    const element: HTMLElement = fixture.nativeElement;
    const handle = element.querySelector<HTMLElement>('.pg-resize-handle');
    const emitted: Record<string, number>[] = [];
    fixture.componentInstance.columnStateChange.subscribe((widths) => emitted.push(widths));

    expect(handle).toBeTruthy();
    handle?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(emitted.length).toBe(1);
    expect(Object.values(emitted[0])[0]).toBe(130);
    expect(element.querySelector('table')?.classList).toContain('pg-fixed');

    handle?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted[1]).toEqual({});
    expect(element.querySelector('table')?.classList).not.toContain('pg-fixed');
  });

  it('renders a single indented row header column in tree layout', () => {
    const fixture = create();
    fixture.componentRef.setInput('rowHeaderLayout', 'tree');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const rows = element.querySelectorAll('tr.pg-row:not(.pg-total-row)');

    expect(rows.length).toBe(5);
    expect(element.querySelectorAll('th.pg-tree-rowheader').length).toBe(5);
    for (const row of Array.from(rows)) {
      expect(row.querySelectorAll('th.pg-rowheader').length).toBe(1);
    }
    const cityHeader = Array.from(
      element.querySelectorAll<HTMLElement>('th.pg-tree-rowheader'),
    ).find((header) => header.textContent?.trim().startsWith('A'));
    expect(cityHeader).toBeTruthy();
    expect(
      cityHeader?.querySelector<HTMLElement>('.pg-rowheader-content')?.style.paddingLeft,
    ).toBe('16px');
  });

  it('collapses tree groups and keeps sticky row headers', () => {
    const fixture = create();
    fixture.componentRef.setInput('rowHeaderLayout', 'tree');
    fixture.componentRef.setInput('stickyRowHeaders', true);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const headers = Array.from(element.querySelectorAll<HTMLElement>('th.pg-tree-rowheader'));
    const firstHeader = headers[0];

    expect(firstHeader.classList).toContain('pg-sticky-col');
    const sulHeader = headers.find((header) => header.textContent?.includes('Sul'));
    const button = sulHeader?.querySelector('button.pg-expander') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(element.querySelectorAll('tr.pg-row:not(.pg-total-row)').length).toBe(3);
  });

  it('navigates tree rows with the keyboard', () => {
    const fixture = create();
    fixture.componentRef.setInput('rowHeaderLayout', 'tree');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const firstCell = element.querySelector('td.pg-cell[data-r="0"]') as HTMLElement;

    firstCell.focus();
    firstCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement?.getAttribute('data-r')).toBe('1');
  });

  it('virtualizes tree rows', () => {
    const fixture = create();
    fixture.componentRef.setInput('rowHeaderLayout', 'tree');
    fixture.componentRef.setInput('virtualScroll', true);
    fixture.componentRef.setInput('height', '64px');
    fixture.componentRef.setInput('rowHeight', 32);
    fixture.componentRef.setInput('virtualOverscan', 0);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(
      element.querySelectorAll('tr.pg-row:not(.pg-total-row)').length,
    ).toBeLessThan(5);
    expect(element.querySelector('.pg-spacer')).toBeTruthy();
  });

  it('uses header templates for tree row headers', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TreeTemplateHostComponent] });
    const fixture = TestBed.createComponent(TreeTemplateHostComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const rowHeaders = element.querySelectorAll('.tree-header[data-axis="row"]');

    expect(rowHeaders.length).toBe(5);
  });

  it('hides the value header with one measure when showValueHeader is false', () => {
    const fixture = create();
    fixture.componentRef.setInput('showValueHeader', false);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.pg-value-row')).toBeNull();
    expect(element.querySelectorAll('th.pg-header-cell').length).toBeGreaterThan(0);
  });

  it('keeps the value header and emits a diagnostic with multiple measures', () => {
    const twoValues: PivotConfig = {
      ...config,
      values: [
        { field: 'amount', caption: 'Total' },
        { field: 'amount', caption: 'Dobro', aggregator: 'count' },
      ],
    };
    const fixture = create(twoValues);
    fixture.componentRef.setInput('showValueHeader', false);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const diagnostics = fixture.componentInstance.result().diagnostics;

    expect(element.querySelector('.pg-value-row')).toBeTruthy();
    expect(diagnostics.some((diagnostic) => diagnostic.code === 'ignored-option')).toBeTrue();
  });


  it('honors theme CSS variables without !important', () => {
    const fixture = create();
    const element: HTMLElement = fixture.nativeElement;
    element.style.setProperty('--pg-cell-align', 'left');
    element.style.setProperty('--pg-cell-font-weight', '700');
    element.style.setProperty('--pg-header-font-weight', '800');
    element.style.setProperty('--pg-rowheader-font-weight', '500');
    element.style.setProperty('--pg-rowheader-align', 'center');
    element.style.setProperty('--pg-total-font-weight', '900');
    element.style.setProperty('--pg-chevron-color', 'rgb(255, 0, 0)');
    element.style.setProperty('--pg-chevron-size', '20px');
    element.style.setProperty('--pg-rowheader-bg', 'rgb(240, 240, 240)');
    element.style.setProperty('--pg-group-bg', 'rgb(255, 238, 204)');
    fixture.detectChanges();

    const cell = element.querySelector<HTMLElement>('td.pg-cell') as HTMLElement;
    const header = element.querySelector<HTMLElement>('th.pg-header-cell') as HTMLElement;
    const rowHeader = element.querySelector<HTMLElement>('th.pg-rowheader') as HTMLElement;
    const expander = element.querySelector<HTMLElement>('button.pg-expander') as HTMLElement;
    const total = element.querySelector<HTMLElement>('td.pg-total') as HTMLElement;

    expect(getComputedStyle(cell).textAlign).toBe('left');
    expect(getComputedStyle(cell).fontWeight).toBe('700');
    expect(getComputedStyle(header).fontWeight).toBe('800');
    expect(getComputedStyle(rowHeader).fontWeight).toBe('500');
    expect(getComputedStyle(rowHeader).textAlign).toBe('center');
    expect(getComputedStyle(rowHeader).backgroundColor).toBe('rgb(240, 240, 240)');
    expect(getComputedStyle(total).fontWeight).toBe('900');
    expect(getComputedStyle(expander).color).toBe('rgb(255, 0, 0)');
    expect(getComputedStyle(expander).width).toBe('30px');
    expect(getComputedStyle(expander).height).toBe('30px');

    const collapsed = create({ ...config, defaultExpandDepth: 0 });
    collapsed.nativeElement.style.setProperty('--pg-group-bg', 'rgb(255, 238, 204)');
    collapsed.detectChanges();
    const groupHeader = collapsed.nativeElement.querySelector(
      'tr.pg-group-row > th.pg-rowheader',
    ) as HTMLElement;
    expect(getComputedStyle(groupHeader).backgroundColor).toBe('rgb(255, 238, 204)');

    const defaults = create({ ...config, defaultExpandDepth: 0 });
    const defaultGroup = defaults.nativeElement.querySelector(
      'tr.pg-group-row > th.pg-rowheader',
    ) as HTMLElement;
    expect(getComputedStyle(defaultGroup).backgroundColor).toBe('rgb(240, 249, 255)');
    const defaultChevron = defaults.nativeElement.querySelector(
      'button.pg-expander',
    ) as HTMLElement;
    expect(getComputedStyle(defaultChevron).color).toBe('rgb(107, 114, 128)');
  });

  it('supports per-value alignment', () => {
    const aligned = create({
      ...config,
      values: [{ field: 'amount', caption: 'Total', align: 'left' }],
    });
    const cell = aligned.nativeElement.querySelector('td.pg-cell') as HTMLElement;
    expect(getComputedStyle(cell).textAlign).toBe('left');
  });

  it('uses --pg-rowheader-width in tree layout', () => {
    const fixture = create();
    fixture.componentRef.setInput('rowHeaderLayout', 'tree');
    fixture.nativeElement.style.setProperty('--pg-rowheader-width', '260px');
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector(
      'th.pg-tree-rowheader',
    ) as HTMLElement;
    expect(getComputedStyle(header).width).toBe('260px');
  });

  it('opens cell details with the source records and closes on Escape', () => {
    const fixture = create();
    fixture.componentRef.setInput('cellDetails', true);
    fixture.componentRef.setInput('cellDetailsMode', 'dialog');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const cell = Array.from(component.result().rowTotals.values()).find(
      (candidate) =>
        candidate.value === 150 && candidate.rowPath.length === 2,
    );
    expect(cell).toBeTruthy();

    const opened: unknown[] = [];
    const closed: unknown[] = [];
    component.cellDetailsOpen.subscribe((context) => opened.push(context));
    component.cellDetailsClose.subscribe(() => closed.push(true));
    component.openCellDetails(cell!, null);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      '.pg-details-dialog',
    ) as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.querySelectorAll('tbody tr').length).toBe(cell!.counts);
    expect(opened.length).toBe(1);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pg-details-dialog')).toBeNull();
    expect(closed.length).toBe(1);
  });

  it('opens details when a cell is clicked', () => {
    const fixture = create();
    fixture.componentRef.setInput('cellDetails', true);
    fixture.componentRef.setInput('cellDetailsMode', 'dialog');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const cell = element.querySelector('td.pg-cell[data-r="0"]') as HTMLElement;
    cell.click();
    fixture.detectChanges();

    expect(element.querySelector('.pg-details-dialog')).toBeTruthy();
  });
  it('drills down into tree parent cells', () => {
    const fixture = create();
    fixture.componentRef.setInput('rowHeaderLayout', 'tree');
    fixture.componentRef.setInput('cellDetails', true);
    fixture.componentRef.setInput('cellDetailsMode', 'dialog');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const parent = component
      .treeRows()
      .find((row) => row.node.caption === 'Sul');
    expect(parent).toBeTruthy();
    const column = component
      .result()
      .columns.find((candidate) => candidate.path[0] === '2026-01')!;
    const cell = component.treeCellFor(parent!.node, column, 'amount');
    expect(cell).toBeTruthy();

    component.openCellDetails(cell!, null);
    fixture.detectChanges();

    const context = component.detailsContext();
    expect(context?.records.length).toBe(2);
    expect(context?.records.reduce((sum, record) => sum + Number(record['amount']), 0)).toBe(
      Number(cell!.value),
    );
  });

  it('shows configured detail columns and the empty state', () => {
    const fixture = create();
    fixture.componentRef.setInput('cellDetails', true);
    fixture.componentRef.setInput('cellDetailsMode', 'dialog');
    fixture.componentRef.setInput('detailsColumns', ['region', 'amount']);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const cell = Array.from(component.result().cells.values())[0];
    component.openCellDetails(cell, null);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const headers = Array.from(
      element.querySelectorAll<HTMLElement>('.pg-details-table th'),
    ).map((header) => header.textContent?.trim());
    expect(headers).toEqual(['region', 'amount']);
  });


  it('shows a hover tooltip with baseline content and closes on leave', fakeAsync(() => {
    const fixture = create();
    fixture.componentRef.setInput('cellDetails', true);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const cell = element.querySelector('td.pg-cell[data-r="0"][data-c="0"]') as HTMLElement;

    cell.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();

    const tooltip = element.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain('Row:');
    expect(tooltip.textContent).toContain('Sum of Total:');
    expect(element.querySelector('.pg-details-dialog')).toBeNull();
    expect(cell.getAttribute('aria-describedby')).toBe(tooltip.id);

    cell.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(element.querySelector('[role="tooltip"]')).toBeNull();
    expect(cell.hasAttribute('aria-describedby')).toBeFalse();
  }));

  it('opens the tooltip on focus and closes with Escape', fakeAsync(() => {
    const fixture = create();
    fixture.componentRef.setInput('cellDetails', true);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const cell = element.querySelector('td.pg-cell[data-r="0"][data-c="0"]') as HTMLElement;

    cell.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    tick(0);
    fixture.detectChanges();
    expect(element.querySelector('[role="tooltip"]')).toBeTruthy();

    element
      .querySelector('table')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelector('[role="tooltip"]')).toBeNull();
  }));

  it('shows tooltip content for totals and tree rows', fakeAsync(() => {
    const fixture = create();
    fixture.componentRef.setInput('cellDetails', true);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const totalCell = element.querySelector('td.pg-total') as HTMLElement;
    totalCell.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    const totalTooltip = element.querySelector('[role="tooltip"]') as HTMLElement;
    expect(totalTooltip.textContent).toContain('Row:');
    expect(totalTooltip.textContent).toContain('Sum of Total:');

    totalCell.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.componentRef.setInput('rowHeaderLayout', 'tree');
    fixture.detectChanges();
    const treeCell = element.querySelector('td.pg-cell') as HTMLElement;
    treeCell.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
    const treeTooltip = element.querySelector('[role="tooltip"]') as HTMLElement;
    expect(treeTooltip.textContent).toContain('Row:');
  }));

  it('positions the tooltip inside the viewport', fakeAsync(() => {
    const fixture = create();
    fixture.componentRef.setInput('cellDetails', true);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const cell = element.querySelector('td.pg-cell[data-r="0"][data-c="0"]') as HTMLElement;
    spyOn(cell, 'getBoundingClientRect').and.returnValue({
      left: 900,
      top: 700,
      right: 988,
      bottom: 730,
      width: 88,
      height: 30,
      x: 900,
      y: 700,
      toJSON: () => ({}),
    } as DOMRect);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1000);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(800);

    cell.dispatchEvent(new MouseEvent('mouseenter', { clientX: 300, clientY: 200 }));
    tick(150);
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();

    const tooltip = element.querySelector('[role="tooltip"]') as HTMLElement;
    expect(parseFloat(tooltip.style.left)).toBeGreaterThanOrEqual(300);
    expect(parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(200);
    expect(parseFloat(tooltip.style.left)).toBeLessThanOrEqual(992);
    expect(parseFloat(tooltip.style.top)).toBeLessThanOrEqual(792);
  }));

  it('localizes tooltip labels and aggregator format', fakeAsync(() => {
    const fixture = create({
      ...config,
      values: [{ field: 'amount', caption: 'MÉDIA POD.', aggregator: 'avg' }],
    });
    fixture.componentRef.setInput('cellDetails', true);
    fixture.componentRef.setInput('labels', {
      detailsRow: 'Linha',
      detailsColumn: 'Coluna',
      aggregators: { avg: 'Média' },
      measureFormat: '{aggregation} de {caption}',
    });
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const cell = element.querySelector('td.pg-cell[data-r="0"][data-c="0"]') as HTMLElement;

    cell.dispatchEvent(new MouseEvent('mouseenter', { clientX: 100, clientY: 100 }));
    tick(150);
    fixture.detectChanges();

    const tooltip = element.querySelector('[role="tooltip"]') as HTMLElement;
    expect(tooltip.textContent).toContain('Linha:');
    expect(tooltip.textContent).toContain('Coluna:');
    expect(tooltip.textContent).toContain('Média de MÉDIA POD.:');
  }));
  it('shows the empty state when there is no data', () => {
    const fixture = create(config, []);
    expect(fixture.nativeElement.querySelector('.pg-empty')).toBeTruthy();
  });
});


























