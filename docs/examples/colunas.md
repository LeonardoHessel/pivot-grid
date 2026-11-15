# Colunas redimensionáveis

Adicionado na 2.1.0 (aditivo). Sem larguras no estado, o layout permanece
idêntico ao anterior.

## Como funciona

- alça de resize no cabeçalho de cada coluna (canto direito);
- arrastar com o mouse/ponteiro;
- teclado: foque a alça e use `←`/`→` (±10px) ou `Home` para restaurar;
- duplo clique na alça restaura a largura;
- `minColumnWidth` (default 60) e `maxColumnWidth` (default 600);
- larguras persistidas em `PivotState.columns` e emitidas em
  `columnStateChange`.

## Uso controlado

```ts
import { PivotState } from 'pivot-grid';

state: PivotState = { expanded: {} };

onColumnState(widths: Record<string, number>): void {
  this.state = { ...this.state, columns: widths };
}
```

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [state]="state"
  [minColumnWidth]="70"
  [maxColumnWidth]="420"
  (columnStateChange)="onColumnState($event)">
</pg-pivot-grid>
```

Sem `[state]`, o componente gerencia as larguras internamente e ainda emite
`columnStateChange`.

## Chave da coluna

As larguras usam a chave da folha de coluna (`PivotNode.key`), estável enquanto
a configuração e os dados gerarem as mesmas colunas.

## Demo

Rota: [`/colunas`](https://leonardohessel.github.io/pivot-grid/colunas)
