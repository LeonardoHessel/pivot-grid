import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { PivotGridComponent } from './pivot-grid.component';
import { PivotConfig, PivotData } from './core/types';

const data: PivotData = [
  { region: 'Sul', city: 'A', month: '2026-01', amount: 100 },
  { region: 'Sul', city: 'B', month: '2026-02', amount: 50 },
  { region: 'Norte', city: 'C', month: '2026-01', amount: 30 },
];

const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região', filterable: true },
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

async function expectNoViolations(
  layout: 'columns' | 'tree',
  showValueHeader: boolean,
): Promise<void> {
  const fixture = TestBed.createComponent(PivotGridComponent);
  fixture.componentRef.setInput('data', data);
  fixture.componentRef.setInput('config', config);
  fixture.componentRef.setInput('rowHeaderLayout', layout);
  fixture.componentRef.setInput('showValueHeader', showValueHeader);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement);

  const results = await axe.run(fixture.nativeElement, {
    rules: { 'color-contrast': { enabled: false } },
  });

  fixture.nativeElement.remove();
  expect(
    results.violations.map((violation) => `${violation.id}: ${violation.nodes.length}`),
  ).toEqual([]);
}

describe('PivotGridComponent accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PivotGridComponent],
    }).compileComponents();
  });

  it('has no axe violations', async () => {
    await expectNoViolations('columns', true);
  });

  it('has no axe violations in tree layout', async () => {
    await expectNoViolations('tree', false);
  });

  it('has no axe violations with tree layout and value header hidden', async () => {
    await expectNoViolations('tree', true);
  });
});
