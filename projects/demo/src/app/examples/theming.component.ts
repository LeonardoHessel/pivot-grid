import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  signal,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import { PivotConfig, PivotData, PivotGridComponent } from 'pivot-grid';

const data: PivotData = [
  { region: 'Norte', city: 'Alfa', month: '2026-01', amount: 57 },
  { region: 'Norte', city: 'Alfa', month: '2026-02', amount: 64 },
  { region: 'Norte', city: 'Bravo', month: '2026-01', amount: 70 },
  { region: 'Sul', city: 'Charlie', month: '2026-01', amount: 96 },
  { region: 'Sul', city: 'Delta', month: '2026-02', amount: 70 },
];

const config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região' },
    { field: 'city', caption: 'CDP Principal' },
  ],
  columns: [{ field: 'month', caption: 'Mês' }],
  values: [{ field: 'amount', caption: 'MÉDIA POD.', aggregator: 'avg' }],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  defaultExpandDepth: 0,
  locale: 'pt-BR',
};

@Component({
  selector: 'app-theming',
  standalone: true,
  imports: [PivotGridComponent, JsonPipe],
  template: `
    <header class="demo-header">
      <div>
        <h1>Tema customizado</h1>
        <p>
          O grid abaixo recebe <strong>somente CSS variables no host</strong>,
          sem <code>::ng-deep</code>, <code>ViewEncapsulation.None</code> ou
          <code>!important</code>.
        </p>
      </div>
    </header>

    <section class="demo-card">
      <pg-pivot-grid
        #grid
        [data]="data"
        [config]="config"
        rowHeaderLayout="tree"
        [showValueHeader]="false"
        [indentSize]="18"
        height="380px"
        width="100%"
        density="compact"
        style="
          --pg-cell-align: left;
          --pg-rowheader-align: center;
          --pg-cell-font-weight: 600;
          --pg-header-font-weight: 700;
          --pg-rowheader-font-weight: 700;
          --pg-total-font-weight: 800;
          --pg-chevron-color: #b45309;
          --pg-chevron-size: 20px;
          --pg-rowheader-bg: #fffbeb;
          --pg-group-bg: #fef3c7;
          --pg-rowheader-width: 230px;
        "
      ></pg-pivot-grid>
    </section>

    <pre class="demo-json">{{ computedStyles() | json }}</pre>
  `,
})
export class ThemingComponent {
  readonly data = data;
  readonly config = config;
  readonly computedStyles = signal<string[]>([]);
  @ViewChild('grid', { read: ElementRef })
  private readonly grid!: ElementRef<HTMLElement>;

  constructor() {
    afterNextRender(() => {
      const host = this.grid?.nativeElement;
      if (!host) {
        return;
      }
      const cell = host.querySelector<HTMLElement>('td.pg-cell');
      const rowHeader = host.querySelector<HTMLElement>('th.pg-tree-rowheader');
      const header = host.querySelector<HTMLElement>('th.pg-header-cell');
      const total = host.querySelector<HTMLElement>('td.pg-total');
      const chevron = host.querySelector<HTMLElement>('button.pg-expander');
      if (!cell || !rowHeader || !header || !total || !chevron) {
        return;
      }
      const read = (element: HTMLElement): CSSStyleDeclaration =>
        getComputedStyle(element);
      this.computedStyles.set([
        `cell.text-align: ${read(cell).textAlign}`,
        `cell.font-weight: ${read(cell).fontWeight}`,
        `header.font-weight: ${read(header).fontWeight}`,
        `rowheader.text-align: ${read(rowHeader).textAlign}`,
        `rowheader.background: ${read(rowHeader).backgroundColor}`,
        `rowheader.font-weight: ${read(rowHeader).fontWeight}`,
        `total.font-weight: ${read(total).fontWeight}`,
        `chevron.color: ${read(chevron).color}`,
        `chevron.size: ${read(chevron).width} x ${read(chevron).height}`,
      ]);
    });
  }
}



