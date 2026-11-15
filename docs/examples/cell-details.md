# Detalhes da célula (drill-down)

Adicionado na 2.3.0. Ao acionar uma célula (ou total), o componente abre um
diálogo com os registros de origem e o resumo agregado.

## API

```ts
cellDetails?: boolean;                       // default false
detailsColumns?: PivotField[] | string[];   // default: campos do registro
detailsTemplate?: TemplateRef<PivotCellDetailsContext>;
```

Saídas: `cellDetailsOpen` (contexto) e `cellDetailsClose`.

```ts
export interface PivotCellDetailsContext {
  cell: PivotCell;
  rowPath: string[];
  columnPath: string[];
  field: string;
  value: number | null;
  formatted: string;
  records: readonly Record<string, unknown>[];
}
```

O engine expõe `PivotResult.recordsForCell(rowPath, columnPath)` **sob
demanda**, reutilizando os índices de registros já calculados.

## Exemplo

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [cellDetails]="true"
  [detailsColumns]="['region', 'city', 'month', 'amount']"
  [labels]="{ detailsTitle: 'Detalhes da célula', detailsClose: 'Fechar' }"
  (cellDetailsOpen)="onOpen($event)"
  (cellDetailsClose)="onClose()">
</pg-pivot-grid>
```

```ts
onOpen(context: PivotCellDetailsContext): void {
  console.log(context.formatted, context.records.length, context.records);
}
```

Funciona em células normais, totais de linha/coluna/geral e no modo tree. O
diálogo tem `role="dialog"`, `aria-modal`, foco preso, fecha com `Esc` e devolve
o foco ao gatilho.

## Evidência

![Detalhes da célula](cell-details.png)

Rota: [`/detalhes?details=1`](https://leonardohessel.github.io/pivot-grid/detalhes?details=1)
