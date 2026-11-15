# Detalhes da célula (hover tooltip + diálogo opcional)

Na 2.4.0 o padrão mudou de **clique/diálogo** para **hover/tooltip**, em
paridade com o baseline Syncfusion 20. O diálogo continua disponível
opcionalmente para clique/touch.

## Baseline observado (somente leitura)

O baseline foi inspecionado em `http://localhost/packreturn-green/`
(Gerenciamento → Giro por CDP, ano 2026), via Chrome DevTools Protocol:

| Aspecto | Comportamento |
|---|---|
| Gatilho | **hover** (não clique) |
| Conteúdo | `Row:` caminho `" - "`, `Column:` caminho, `Avg of <medida>:` valor |
| Registros | **não exibe** registros, somente o resumo |
| Atraso | ~20 ms (praticamente imediato) |
| Posição | abaixo/à direita da célula/cursor; `max-width: 350px`; largura ~160–172 px |
| Aparência | fundo cinza `#616161`, texto branco, 12–14 px |
| Totais | mesmo formato; subtotal de coluna mostra o caminho da coluna |
| Tree | tooltip apenas nas células de valor; o cabeçalho de linha não tem tooltip |
| Fechamento | ao sair da célula |
| Teclado/touch | foco/teclado não abre no baseline; sem tooltip por toque |

No pivot-grid, o conteúdo essencial é replicado e adicionamos abertura por
**foco de teclado**, `aria-describedby`, `role="tooltip"` e fechamento com
`Esc`.

## API

```ts
cellDetails?: boolean;                       // default false
cellDetailsTrigger?: 'hover' | 'click';      // default 'hover'
cellDetailsMode?: 'tooltip' | 'dialog';      // default 'tooltip'
detailsColumns?: PivotField[] | string[];   // usado no diálogo/template
detailsTemplate?: TemplateRef<PivotCellDetailsContext>;
```

```html
<!-- tooltip no hover (default) -->
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [cellDetails]="true">
</pg-pivot-grid>

<!-- diálogo opcional para clique/touch -->
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [cellDetails]="true"
  cellDetailsMode="dialog"
  cellDetailsTrigger="click">
</pg-pivot-grid>
```

- Delay do tooltip: **150 ms**; fecha ao sair, no scroll e com `Esc`.
- Posiciona abaixo da célula e reposiciona para não sair da viewport.
- Sem backdrop e sem prender foco no tooltip.
- `detailsTemplate` continua valendo; no modo dialog o contexto inclui
  `records` via `PivotResult.recordsForCell`. No tooltip padrão os registros não
  são copiados (`records: []`), como no baseline.
- `cellDetailsOpen` / `cellDetailsClose` continuam disponíveis.

## Evidência

Hover (tooltip, sem modal):

![Tooltip no hover](cell-details.png)

Diálogo opcional (`cellDetailsMode="dialog"`):

![Diálogo opcional](cell-details-dialog.png)

Rotas: [`/detalhes`](https://leonardohessel.github.io/pivot-grid/detalhes) e
[`/detalhes?dialog=1`](https://leonardohessel.github.io/pivot-grid/detalhes?dialog=1).
