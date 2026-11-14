import { TestBed } from '@angular/core/testing';
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
  it('shows the empty state when there is no data', () => {
    const fixture = create(config, []);
    expect(fixture.nativeElement.querySelector('.pg-empty')).toBeTruthy();
  });
});



