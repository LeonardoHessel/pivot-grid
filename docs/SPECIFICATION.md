# Especificação — `@leonardohessel/pivot-grid`

> Status: **rascunho de especificação (pré-implementação)**.
> Este documento é a fonte de verdade do comportamento esperado. Código e
> documentação de uso devem ser derivados dele.

## 1. Identidade

| Item | Valor |
|---|---|
| Pacote | `@leonardohessel/pivot-grid` |
| Repositório | `github.com/LeonardoHessel/pivot-grid` |
| Licença | MIT |
| Escopo v1 | Angular `>=18 <21` |
| Escopo v2 (planejado) | Angular `>=21` |
| Dependências de runtime | nenhuma além de `@angular/*` e `tslib` |

## 2. Objetivo

Oferecer um componente Angular nativo para exibir **tabelas dinâmicas (pivot)**
a partir de uma lista plana de registros, com:

- hierarquia de linhas em múltiplos níveis;
- colunas dinâmicas derivadas de campos;
- agregação de valores (`sum`, `avg`, `min`, `max`, `count`, `countDistinct`);
- totais por linha, por coluna e geral;
- expandir/colapsar, ordenação, formatação e destaque condicional;
- exportação CSV (nativo) e Excel (via adaptador);
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
- Virtualização de linhas/colunas (prevista para v1.1).
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
   `@leonardohessel/pivot-grid/core`, sem dependência de Angular.
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
pivot-grid (entry point principal)
├── PivotGridComponent          # renderização Angular
├── PivotModule (opcional)      # compatibilidade com NgModules
└── core/ (entry point secundário)
    ├── buildPivot()            # pipeline de agregação
    ├── sortPivot()             # ordenação de eixos
    ├── formatPivotValue()      # formatação numérica
    ├── evaluateRules()         # formatação condicional
    └── exporters/              # CSV nativo, adaptador Excel
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
- O cabeçalho é multi-linha: cada nível ocupa uma linha de `<thead>`, com
  `colspan` nas folhas e `rowspan` nos rótulos de valor.
- Colunas são ordenadas pelo mesmo critério das linhas.
- Colunas sem dados não são criadas (não há colunas vazias).

### 8.3 Valores

- v1 suporta **um** item em `values`. Mais de um gera diagnóstico e apenas o
  primeiro é usado (multi-valor está no roadmap v1.1).
- `caption` do valor aparece no cabeçalho.
- `format` pode ser string de opções (`Intl.NumberFormat`) ou função
  `(value: number) => string`.

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
- **Excel**: interface `PivotExcelExporter` (adaptador). O pacote **não**
  embute biblioteca de XLSX; o consumidor injeta um adaptador. Um adaptador
  padrão leve está no roadmap v1.1.
- `exportMode`: `'visible'` (apenas expandido) ou `'full'` (default: matriz
  completa).
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
- Cabeçalho ordenável expõe `aria-sort`.
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

- [ ] Engine com `sum/avg/min/max/count/countDistinct` e testes.
- [ ] Linhas multi-nível + colunas dinâmicas + totais.
- [ ] Expandir/colapsar e estado controlado.
- [ ] Formatação numérica e `emptyText`.
- [ ] Formatação condicional (operadores + estilo).
- [ ] CSV nativo com proteção de fórmula.
- [ ] Demo com dataset genérico e troca de configuração.
- [ ] Acessibilidade básica (roles, teclado, aria-sort).
- [ ] README + API.md + ENGINE.md publicados.
- [ ] CI (build + testes) verde.

## 14. Decisões abertas

| # | Decisão | Opções | Proposta |
|---|---|---|---|
| 1 | Excel nativo ou adaptador | adaptador (v1) / XLSX interno (v1.1) | adaptador no v1 |
| 2 | Múltiplos valores | v1.1 | um valor no v1 |
| 3 | Signals vs decorators | signals (18+) | signals |
| 4 | Virtualização | v1.1 | após MVP |
| 5 | Server-side | v2 | após v1.0 |
