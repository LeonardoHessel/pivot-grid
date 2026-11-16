# Especificação — `pivot-grid`

> Status: **estável (2.1.0)**. Este documento descreve o comportamento
> implementado e é a fonte de verdade para a API congelada.

## 1. Identidade

| Item | Valor |
|---|---|
| Pacote | `pivot-grid` |
| Repositório | `github.com/LeonardoHessel/pivot-grid` |
| Licença | MIT |
| Escopo 2.x | Angular `>=21 <23` |
| Escopo 1.x | Angular `>=18 <21` |
| Dependências de runtime | nenhuma além de `@angular/*` e `tslib` |

## 2. Objetivo

Oferecer um componente Angular nativo para exibir **tabelas dinâmicas (pivot)**
a partir de uma lista plana de registros, com:

- hierarquia de linhas em múltiplos níveis;
- colunas dinâmicas derivadas de campos;
- agregação de valores (`sum`, `avg`, `min`, `max`, `count`, `countDistinct`);
- totais por linha, por coluna e geral;
- expandir/colapsar, ordenação, formatação e destaque condicional;
- exportação CSV nativa e Excel (XLSX mínimo, sem dependência);
- acessibilidade e temas por CSS variables.

O componente deve ser **genérico**: não conhece nenhum domínio de negócio, não
faz requisições HTTP e não depende de estado global.

## 3. Não-objetivos (v1)

- Edição de células.
- Fórmulas e campos calculados.
- Conexão direta com banco/API (o consumidor fornece os dados).
- Pivot chart.
- Drag-and-drop de campos (painel de campos).
- Filtros de eixo na interface.
- Reordenar/fixar colunas e drill-down (2.2/2.3).
- Modo server-side (previsto para v2).
- Exportação PDF.

## 4. Público e casos de uso

| Caso | Descrição |
|---|---|
| Relatório analítico | Vendas por região → canal → produto, colunas por ano/mês. |
| Indicadores operacionais | Quantidade média/soma por unidade e período. |
| Conferência de dados | Comparação de totais com destaque de valores fora da faixa. |
| Exportação | Baixar a tabela montada para planilha. |

## 5. Princípios de design

1. **Engine separado da renderização.** Toda a matemática vive em
   `src/lib/core`, sem dependência de Angular, exportado pelo pacote principal.
2. **Dados imutáveis na entrada.** O componente nunca muta o array recebido.
3. **Renderização declarativa.** A saída do engine é uma estrutura pronta para
   render; o componente só decide o que está visível (expandido).
4. **Sem dependências de runtime.** Nada de jQuery, moment, lodash, etc.
5. **Acessibilidade e teclado desde a primeira versão.**
6. **Tema por CSS variables**, sem CSS global obrigatório.
7. **Determinismo.** Mesma entrada + mesma configuração = mesma saída,
   independentemente da ordem de iteração de objetos.

## 6. Arquitetura

```
pivot-grid (public-api.ts — única superfície)
├── PivotGridComponent          # renderização Angular
└── lib/core/ (engine puro, interno)
    ├── build-pivot.ts          # pipeline de agregação
    ├── aggregate.ts            # acumuladores por agregador
    ├── util.ts                 # chaves, datas, Intl
    ├── csv.ts e xlsx.ts        # exportadores nativos
    └── types.ts                # tipos públicos
```

Fluxo:

```
data + config
   │
   ▼
validate()  → diagnóstico (dev) / resultado vazio (prod)
   │
   ▼
group()     → árvores de linha e coluna
   │
   ▼
aggregate() → células + totais
   │
   ▼
sort()      → ordenação por nível
   │
   ▼
PivotResult (imutável)
   │
   ▼
componente → estado de expansão → matriz visível → DOM
```

## 7. Modelo de dados

### 7.1 Entrada

Array de registros planos (`readonly Record<string, unknown>[]`). Cada campo
usado em `rows`, `columns` ou `values` é lido por nome, com suporte a caminho
aninhado por ponto (`"customer.region"`).

### 7.2 Tipos de campo

| Uso | Tipo esperado | Conversão |
|---|---|---|
| Linha/coluna | `string`, `number`, `boolean`, `Date` | convertido para chave estável (`String`); `Date` → ISO `YYYY-MM-DD` |
| Valor | `number` finito | `null`, `undefined`, `NaN`, `Infinity` e `''` são **ignorados** |

Campos de valor que não sejam números geram **diagnóstico** (dev) e a célula
correspondente é ignorada na agregação.

### 7.3 Chaves e caminhos

Cada nó tem um `path: string[]` (valores dos campos desde a raiz). A chave
canônica é `path.join('\u001f')`. Chaves são únicas por eixo.

### 7.4 Semântica de agregação

| Agregador | Regra | Conjunto vazio |
|---|---|---|
| `sum` | soma dos valores válidos | `0` (mas célula sem linhas contribuintes renderiza vazio) |
| `avg` | `sum / count` dos válidos | vazio |
| `min` | menor válido | vazio |
| `max` | maior válido | vazio |
| `count` | quantidade de valores válidos | `0` (renderiza `0` se houver linha) |
| `countDistinct` | cardinalidade dos valores convertidos em string | `0` |

Regras:

- `null`/inválidos **não** entram em `count`/`avg`;
- `avg` **nunca** é média de médias: é recalculado a partir dos dados brutos;
- totais são recalculados sobre todas as folhas do escopo, nunca somando
  subtotais já arredondados;
- arredondamento acontece **somente na formatação**, nunca no acumulador
  (evita erro acumulado).

## 8. Funcionalidades

### 8.1 Eixos de linha (múltiplos níveis)

- `rows` é uma lista ordenada de campos; cada nível é um nó pai.
- Nós exibem `caption` (se definido) ou o valor bruto.
- Cada nó tem `expanded` (padrão: `defaultExpandDepth`, default `1`).
- Expandir/colapsar afeta apenas os descendentes daquele nó.
- A linha de total (quando visível) não é expansível.

### 8.2 Eixos de coluna (dinâmicos)

- `columns` define a hierarquia; as folhas viram colunas de valores.
- A **medida é o nível mais interno**: para cada folha de coluna há uma
  sub-coluna por item de `values` (ano → mês → medida). Com uma única medida,
  o layout é idêntico ao anterior.
- O cabeçalho é multi-linha: cada nível ocupa uma linha de `<thead>`, com
  `colspan` nas folhas e `rowspan` nos rótulos de valor.
- Colunas são ordenadas pelo mesmo critério das linhas.
- Colunas sem dados não são criadas (não há colunas vazias).

### 8.3 Valores

- `values` aceita **uma ou mais** medidas; cada uma agrega e renderiza sua
  própria célula/total.
- Ordenação por valor usa a primeira medida, salvo `sort.field`.
- `caption` do valor aparece no cabeçalho.
- `format` pode ser objeto `Intl.NumberFormatOptions` ou função
  `(value: number) => string`.
- **Medidas auxiliares** (`auxiliaryValues`): agregadas por célula e por total,
  disponíveis em `cell.auxiliary[field]`, mas **não renderizadas**. Servem para
  regras condicionais (`rule.measure`) sobre uma segunda medida.

### 8.4 Totais

| Total | Quando | Cálculo |
|---|---|---|
| Linha | `showRowTotals` | agrega todas as colunas-folha daquela linha |
| Coluna | `showColumnTotals` | agrega todas as linhas-folha daquela coluna |
| Geral | `showGrandTotal` | agrega todas as células |

- `totalsPosition: 'end'` (default) ou `'start'`.
- Totais têm classe `pg-total` e `aria-*` próprios.
- Se só houver um nível de linha, o total de linha é omitido (seria redundante)
  — configurável via `alwaysShowRowTotals`.

### 8.5 Expandir/colapsar

- Botão com `aria-expanded` e rótulo acessível.
- `expandAll`/`collapseAll` recalculam apenas a matriz visível, sem re-agregar.
- Estado inicial: `defaultExpandDepth`; `expandAll: true` expande tudo.
- Mudança dispara `expandChange` e `stateChange`.

### 8.6 Ordenação

- `sort` por eixo: `{ by: 'caption' | 'value', field?, direction: 'asc'|'desc' }`.
- Default: `caption` ascendente com `Intl.Collator(locale, { numeric: true })`.
- Ordenação por valor usa a agregação do primeiro valor configurado.
- Ordenação é **estável**: empates preservam a ordem de primeira ocorrência nos
  dados de entrada.
- Totais sempre ao final (ou início, conforme `totalsPosition`).
- `sortChange` é emitido após reordenar.

### 8.7 Formatação

- Baseada em `Intl.NumberFormat(locale, options)`; default
  `{ maximumFractionDigits: 0 }`.
- `locale` default: `navigator.language` (fallback `'en-US'`); SSR usa `'en-US'`.
- Valor nulo → `emptyText` (default `''`).
- Negativos: formatação padrão do `Intl` (não altera sinal).
- Formatação **não** altera o valor armazenado nem a ordenação.

### 8.8 Células vazias

- Sem linhas contribuintes → `emptyText`.
- Com linhas mas agregador sem valor (ex.: `avg` sem válidos) → `emptyText`.
- `count` com zero válidos → `0`.
- `emptyText` é por valor (`ValueConfig.emptyText`) e global (`config.emptyText`).

### 8.9 Formatação condicional

```ts
interface ConditionalRule {
  target: 'cell' | 'row' | 'column';
  field?: string;
  operator: '>' | '>=' | '<' | '<=' | '=' | '!=' | 'between' | 'notBetween';
  value: number | [number, number];
  style?: Record<string, string>;
  className?: string;
  applyToTotals?: boolean;
  predicate?: (cell: PivotCell) => boolean;
}
```

- Avaliação em ordem de declaração; **primeira regra que casar vence**.
- `predicate` tem precedência sobre `operator/value` quando presente.
- `applyToTotals` default `false`.
- Regras nunca lançam: predicado com exceção é ignorado e gera diagnóstico.

### 8.10 Estados de interface

| Estado | Gatilho | Comportamento |
|---|---|---|
| `loading` | input `loading` | overlay com `aria-busy="true"`, mantém estrutura |
| vazio | `data.length === 0` | `noData` centralizado, tabela oculta |
| erro de config | config inválida | `error` no dev; em produção, estado vazio + diagnóstico |
| normal | dados + config válidos | tabela |

### 8.11 Exportação

- **CSV nativo**: separador configurável (default `,`), UTF-8 com BOM
  opcional, aspas duplas escapadas, quebras de linha normalizadas.
- **Proteção contra injeção de fórmula**: células iniciadas por `=`, `+`, `-`,
  `@`, TAB ou CR são prefixadas com `'`.
- **Excel**: writer XLSX mínimo embutido (ZIP + XML, sem dependência), com
  cabeçalho em negrito e painel congelado.
- `mode: 'full'` exporta todas as folhas; `mode: 'visible'` exporta apenas as
  linhas visíveis (expandidas ou colapsadas em subtotal).
- Exportação inclui cabeçalhos multi-nível achatados e totais visíveis.

### 8.12 Estado

```ts
interface PivotState {
  expanded: Record<string, boolean>; // chave = axis + path
  sort?: { rows?: PivotSort; columns?: PivotSort };
}
```

- `state` é input opcional e `stateChange` é output.
- O componente não persiste nada (localStorage é responsabilidade do consumidor).
- `getState()`/`setState()` disponíveis via referência de template.

### 8.13 Internacionalização

- Rótulos padrão em inglês, sobrescritos por `labels: Partial<PivotLabels>`.
- Nenhum texto fixo no DOM além de ícones decorativos.
- `locale` afeta apenas números/ordenação.

```ts
interface PivotLabels {
  grandTotal: string; rowTotal: string; columnTotal: string;
  empty: string; noData: string; loading: string;
  expand: string; collapse: string; export: string;
}
```

### 8.14 Acessibilidade

- Container `role="grid"`, linhas `role="row"`, células `role="gridcell"`,
  cabeçalhos `role="columnheader"`/`"rowheader"`.
- `aria-rowcount`, `aria-colcount`, `aria-rowindex`, `aria-colindex`.
- Alça de resize expõe `role="separator"` com `aria-valuenow/min/max` (2.1).
- Botão de expandir: `aria-expanded` + `aria-label` ("Expandir …").
- Navegação por teclado:
  - `Tab` entra/sai do grid;
  - setas movem a célula focada (roving tabindex);
  - `←`/`→` colapsam/expandem linha;
  - `Home`/`End` primeira/última coluna visível;
  - `PageUp`/`PageDown` rolam uma página;
  - `Enter`/`Space` acionam a ação do elemento focado.
- Foco visível com `:focus-visible` e contraste mínimo AA.
- Anúncio de mudanças de expansão via `aria-live="polite"` (região oculta).

### 8.15 Temas

- Aparência controlada por CSS variables: cores, bordas, densidade,
  tipografia e estados.
- Classes públicas estáveis: `pg-root`, `pg-table`, `pg-header`, `pg-row`,
  `pg-cell`, `pg-total`, `pg-expander`.
- `density: 'compact' | 'default' | 'comfortable'`.
- `dir="rtl"` suportado via `direction` herdada; ícones espelhados.

### 8.16 Performance

Metas (hardware de referência: notebook 4 núcleos):

| Cenário | Meta |
|---|---|
| Engine, 10.000 linhas × 12 meses, 1 valor | ≤ 80 ms |
| Render inicial, 1.000 linhas visíveis × 12 colunas | ≤ 200 ms |
| Expandir um nó | ≤ 16 ms (sem re-agregar) |
| Mudança de input | cancelável/reaplicada sem vazar memória |

Diretrizes: `OnPush`, `trackBy` por chave, cálculo da matriz visível sob demanda,
sem `ngDoCheck`, sem manipulação de DOM fora do Angular.

### 8.17 SSR

- Nenhum acesso a `window`/`document` no construtor/inputs.
- Formatação usa `locale` explícito quando SSR.
- `loading` e estados são determinísticos no servidor.
- A linha 2.x suporta SSR/hydration (`@angular/ssr`); medições de viewport usam
  `ResizeObserver` apenas no browser.

### 8.18 Virtualização

- `virtualScroll: true` renderiza apenas a janela visível de linhas.
- `rowHeight` (px) define a altura fixa usada no cálculo; `virtualOverscan`
  adiciona linhas extras acima/abaixo.
- Cabeçalho de colunas e colunas de rótulos permanecem **sticky**.
- Em modo virtual, as colunas de rótulos não usam `rowspan`; cada linha exibe
  seu próprio caminho para manter alinhamento e sticky.
- Spacers superior/inferior preservam a altura total e a posição do scroll.
- `height` em px é usado diretamente como viewport; `%` usa `ResizeObserver`.

### 8.19 Dimensionamento e scroll

- `width` default `'100%'`; `height` default `'100%'`.
- O componente ocupa o container, com **scroll interno** (vertical e
  horizontal); a página externa não é empurrada.
- `stickyHeaders: true` mantém o cabeçalho multi-nível fixo no scroll vertical
  e a coluna de rótulos fixa no scroll horizontal.
- Valores numéricos são tratados como pixels; strings CSS são aceitas.

### 8.20 Filtros

- `PivotField.filterable` habilita o campo na barra de filtros do componente.
- `PivotFilter { field, values }` é aplicado **antes** da agregação; `values`
  vazio significa sem restrição.
- O componente mantém o estado internamente quando `filters` não é fornecido e
  emite `filtersChange`.

### 8.21 Hierarquia de datas

- `dateHierarchy: true` expande em ano + mês; um array escolhe os níveis
  (`year`, `quarter`, `month`, `day`).
- Aceita `Date`, ISO ou string parseável; valores derivados são strings
  (`2026`, `Q1`, `01`).
- Cada nível vira um nível do eixo, mantendo a ordem configurada.

### 8.22 Redimensionamento de colunas (2.1)

- Alça no cabeçalho da coluna; arraste com ponteiro.
- `minColumnWidth` (default 60) e `maxColumnWidth` (default 600).
- Teclado na alça: `←`/`→` (±10px), `Home` restaura; duplo clique restaura.
- Larguras ficam em `PivotState.columns` (chave da folha) e são emitidas em
  `columnStateChange`.
- Sem larguras no estado, o layout permanece o padrão (sem `table-layout:
  fixed`).
### 8.23 Layout do cabeçalho de linha (2.2)

- `rowHeaderLayout: 'columns' | 'tree'`; default `columns` (preserva o layout
  anterior).
- `tree` renderiza **uma** coluna de cabeçalho, com indentação
  `node.level * indentSize` (default 16), chevrons e largura
  `rowHeaderWidth` (default 200).
- Todos os nós visíveis são renderizados (pais e folhas); nós internos usam
  `nodeCells` e `rowTotals` do engine, portanto exibem agregados corretos.
- Funciona com sticky, virtualização, teclado, `headerTemplate`, filtros,
  hierarquia de datas, export e estado controlado.
- `columns` mantém uma coluna por campo, com `rowspan` como antes.

### 8.24 Cabeçalho da medida (2.2)

- `showValueHeader` default `true`.
- Com **uma** medida e `false`, a linha de cabeçalho da medida é removida;
  os cabeçalhos de coluna passam a identificar apenas a coluna.
- Com **duas ou mais** medidas, a linha é mantida e um diagnóstico
  `ignored-option` é adicionado a `PivotResult.diagnostics`.

### 8.25 Contrato de tema (2.3)

- Tokens documentados em `theme/_tokens.scss`, com defaults no `:host`.
- O consumidor altera alinhamento, pesos, chevron, fundos e largura do tree
  apenas com CSS variables no host; sem `::ng-deep`, `ViewEncapsulation.None`
  ou `!important`.
- `PivotValueField.align` sobrescreve o alinhamento daquela medida.
- `text-align` fica apenas em `.pg-cell`/`.pg-rowheader`, nunca no seletor de
  tabela.

### 8.26 Detalhes da célula (2.4)

- Padrão: cellDetails true, cellDetailsTrigger hover, cellDetailsMode tooltip.
- Hover abre após 150 ms, **junto ao cursor** (fallback à célula no foco), com
  reposicionamento para não sair da viewport; fecha ao sair, no scroll e com Esc.
- Conteúdo padrão: Row: caminho (join " - "), Column: caminho,
  "<Agg> of <medida>:" valor formatado. Não exibe registros (paridade com o
  baseline Syncfusion 20).
- Teclado: focusin na célula abre o tooltip; aria-describedby aponta para o
  role="tooltip"; Esc fecha. Sem backdrop/prender foco no tooltip.
- detailsTemplate substitui o conteúdo.
- cellDetailsMode="dialog" mantém o diálogo acessível e usa
  detailsColumns/recordsForCell; o gatilho é cellDetailsTrigger.
- Saídas cellDetailsOpen/cellDetailsClose em ambos os modos.
- Localização: detailsRow/detailsColumn, aggregators (parcial por agregador) e
  measureFormat com placeholders {aggregation}/{caption}; defaults em inglês
  (Row/Column, Sum/Avg/...). O texto da medida não usa strings fixas.

## 9. API do componente
## 9. API do componente (resumo)

Detalhes em [`API.md`](./API.md).

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [state]="state"
  [loading]="loading"
  [density]="'compact'"
  (cellClick)="onCell($event)"
  (expandChange)="onExpand($event)"
  (sortChange)="onSort($event)"
  (stateChange)="state = $event">
</pg-pivot-grid>
```

## 10. Eventos

| Evento | Payload |
|---|---|
| `cellClick` | `{ rowPath, columnPath, field, value, formatted, source }` |
| `headerClick` | `{ axis, path, field }` |
| `expandChange` | `{ axis, path, expanded }` |
| `sortChange` | `{ rows?, columns? }` |
| `stateChange` | `PivotState` |
| `filtersChange` | `PivotFilter[]` |
| `columnStateChange` | `Record<string, number>` |
| `exportComplete` | `{ format: 'csv' \| 'xlsx', filename }` |

## 11. Validação e diagnóstico

- `config.rows` pode ser vazio (pivot de coluna única).
- `config.values` deve ter ao menos um item; `columns` pode ser vazio.
- Campos inexistentes nos dados: aviso único por campo em dev.
- Valores não numéricos: aviso com contagem, dados ignorados.
- `strict: true` transforma avisos em erro (apenas em modo dev).
- Diagnósticos **nunca** são exibidos na UI por padrão; ficam em
  `result.diagnostics`.

## 12. Requisitos não funcionais

- Bundle da lib ≤ 60 kB (min+gzip), sem dependências.
- Cobertura de testes: core ≥ 90%, componente ≥ 80%.
- Sem `any` público; `strict` e `strictTemplates`.
- Compatível com zoneless (v2) — sem dependência de `NgZone`.
- Sem vazamento de memória ao trocar `data` repetidamente.

## 13. Critérios de aceite do MVP (v0.1)

- [x] Engine com `sum/avg/min/max/count/countDistinct` e testes.
- [x] Linhas multi-nível + colunas dinâmicas + totais.
- [x] Expandir/colapsar e estado controlado.
- [x] Formatação numérica e `emptyText`.
- [x] Formatação condicional (operadores + estilo).
- [x] CSV nativo com proteção de fórmula.
- [x] Demo com dataset genérico e troca de configuração.
- [x] Acessibilidade básica (roles, teclado, axe).
- [x] README + API.md + ENGINE.md publicados.
- [x] CI (build + testes) verde.

## 14. Decisões

| # | Decisão | Escolha |
|---|---|---|
| 1 | Excel | **writer XLSX mínimo sem dependência** (v0.2.0) |
| 2 | Múltiplos valores | implementado na 0.4.0 |
| 3 | Signals vs decorators | signals (18+) |
| 4 | Virtualização | implementada na 0.5.0 |
| 5 | Server-side | v2 |
| 6 | Medidas auxiliares | `auxiliaryValues` + `rule.measure` (implementado) |
| 7 | Distribuição | npm com versão pinada; publish por tag |







