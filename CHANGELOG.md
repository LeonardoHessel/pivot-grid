# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [2.3.1] - 2026-11-15

### Fixed

- Fallbacks de --pg-chevron-color e --pg-group-bg para os tokens base
  (--pg-color-muted/--pg-color-total-bg), preservando os defaults visuais.

## [2.3.0] - 2026-11-15

### Added

- Contrato completo de tema: `--pg-cell-align`, `--pg-rowheader-align`,
  `--pg-cell-font-weight`, `--pg-header-font-weight`,
  `--pg-rowheader-font-weight`, `--pg-total-font-weight`,
  `--pg-chevron-color`, `--pg-chevron-size`, `--pg-rowheader-bg`,
  `--pg-group-bg`, `--pg-rowheader-width`.
- `PivotValueField.align` para alinhamento semântico por medida.
- Drill-down: `cellDetails`, `detailsColumns`, `detailsTemplate`,
  `cellDetailsOpen`/`cellDetailsClose`, `PivotCellDetailsContext` e
  `PivotResult.recordsForCell`.
- Diálogo acessível com `role="dialog"`, `aria-modal`, foco preso, `Esc` e
  retorno de foco.
- Tokens em `src/lib/theme/_tokens.scss`; estilos sem `!important` e sem
  `::ng-deep`.
- Exemplos `docs/examples/theming.md` e `docs/examples/cell-details.md`, com
  rotas `/tema` e `/detalhes` e capturas de evidência.
- Testes de computed styles, drill-down em totais/tree, teclado e axe com
  diálogo.

## [2.2.0] - 2026-11-15

### Added

- `rowHeaderLayout: 'columns' | 'tree'` (default `columns`): modo tree com uma
  única coluna hierárquica indentada, chevrons, largura configurável e
  agregados por nó.
- `indentSize` (default 16) e `rowHeaderWidth` (default 200).
- `showValueHeader` (default true): remove a linha da medida com uma medida;
  com múltiplas, mantém e emite diagnóstico `ignored-option`.
- Variáveis de tema `--pg-header-font-size`, `--pg-cell-font-size` e
  `--pg-row-height`.
- Exemplo `docs/examples/row-header-tree.md` e rota `/row-header` com toggle.
- Testes de tree (coluna única, indentação, expandir, sticky, teclado,
  virtualização, template) e de `showValueHeader`.

## [2.1.1] - 2026-11-15

### Documentation

- Revisão completa da documentação para o estado atual (2.x Angular 21/22 e
  linha 1.x Angular 18–20): README raiz e do pacote, política de releases,
  compatibilidade, contribuição, integração, roadmap, especificação, API e
  guias de migração.
- **Versão apenas de documentação**: nenhuma mudança de código, API ou
  comportamento. Publicada porque o README do pacote (exibido no npm) só é
  atualizado com uma nova versão.

## [2.1.0] - 2026-11-15

### Added

- Colunas redimensionáveis: alça no cabeçalho, `minColumnWidth`/
  `maxColumnWidth`, reset com duplo clique e teclado (setas/Home).
- Larguras persistidas em `PivotState.columns` e evento
  `columnStateChange`.
- Exemplo `docs/examples/colunas.md` e rota `/colunas` na demo.
- Testes de componente para estado, teclado e reset.

## [2.0.0] - 2026-11-15

Primeira versão estável da linha Angular 21+. Sem feature nova em relação ao
RC 2.0.0-rc.1.

### Changed

- RC validado pelo consumidor no **Angular 22** (matriz, totais, regras,
  células vazias, pt-BR, sticky, XLSX e zero erros de console).
- Publicação como `latest`; a 1.2.0 permanece disponível para Angular 18–20.

## [2.0.0-rc.1] - 2026-11-15

Release Candidate da linha Angular 21+, sem feature nova em relação à 1.2.0.

### Changed

- `peerDependencies` para `>=21 <23`.
- Demo **zoneless** por padrão (`provideZonelessChangeDetection`, sem `zone.js`).
- Demo com **SSR/hydration** (`@angular/ssr`, `outputMode: server`,
  prerender de rotas estáticas e `provideClientHydration`).
- Matriz de compatibilidade testada em Angular **21 e 22**.
- Guia de migração 1.x → 2.x em `docs/MIGRATION-2.md`.

## [1.2.0] - 2026-11-14

### Added

- `cellTemplate` e `headerTemplate` opcionais, com contexto tipado
  (`PivotCellTemplateContext` / `PivotHeaderTemplateContext`).
- Templates aplicados a células de dados e totais; cabeçalhos de linha e coluna.
- Exemplo `docs/examples/templates.md` e rota `/templates` na demo.
- Teste de componente com templates customizados.

## [1.1.0] - 2026-11-14

### Added

- Filtros por eixo: `PivotField.filterable`, `PivotConfig.filters`,
  `PivotFilter`, input `filters` e output `filtersChange`, com barra de filtros
  no componente.
- Hierarquia de datas: `PivotField.dateHierarchy` (`year`, `quarter`, `month`,
  `day`) derivando níveis de um único campo.
- Exemplo `docs/examples/filtros.md` e rota `/filtros` na demo.
- Testes de engine e componente para filtros e hierarquia.

## [1.0.0] - 2026-11-14

Primeira versão estável. Sem feature nova em relação ao RC.

### Changed

- API congelada e publicada como `latest`.
- RC 0.9.0 validado pelo consumidor (matriz, totais, regras, XLSX, sticky,
  zero erros de console).

## [0.9.0] - 2026-11-14

Release Candidate (sem feature nova).

### Removed

- `PivotResult.grandTotal` (usar `grandTotals`).
- `PivotConfig.totalsPosition` e `alwaysShowRowTotals`.
- `PivotField.align`.
- `ConditionalRule.target`.
- `PivotGridComponent.refresh()`.

### Changed

- API pública congelada para a 1.0; `public-api.ts` é a única superfície.
- `docs/API.md` marca a API como estável e lista os exports.
- `docs/MIGRATION.md` com o guia 0.6.0 → 0.9.0.
- Publicação do RC com dist-tag `next`; `latest` permanece na 0.6.0.

## [0.6.0] - 2026-11-14

### Added

- Auditoria de acessibilidade com `axe-core` no CI e correção do cabeçalho
  vazio (`aria-hidden` na célula de canto).
- Matriz de compatibilidade (`compat.yml`) com apps consumidores Angular 18,
  19 e 20.
- Orçamentos de performance formalizados: 10k ≤ 500 ms e 50k ≤ 2500 ms.
- `engines` (Node) e `packageManager` (npm 11) no repositório.
- `docs/COMPATIBILITY.md` e `docs/PERFORMANCE.md`.

### Changed

- Actions atualizadas para `checkout@v5` e `setup-node@v5` (Node 22).

### Deprecated

- `PivotResult.grandTotal` (usar `grandTotals`), `totalsPosition`,
  `alwaysShowRowTotals`, `PivotField.align`, `ConditionalRule.target`
  para `row`/`column` e `PivotGridComponent.refresh()`.

## [0.5.0] - 2026-11-14

### Added

- Virtualização de linhas (`virtualScroll`, `rowHeight`, `virtualOverscan`),
  com cabeçalho de colunas e colunas de rótulos sticky e spacers de altura.
- Exportação `mode: 'visible' | 'full'` em CSV e XLSX, com `rows` visíveis.
- Exemplo `docs/examples/virtualizacao.md` e rota `/virtualizacao` (50k linhas).
- Benchmark de 50k linhas no CI (`BENCH_MAX_50K_MS`).
- Testes de virtualização/scroll e export visible.

### Changed

- `CsvExportOptions.mode` e `XlsxExportOptions.mode` passam a existir e a
  funcionar (a remoção da 0.3.1 foi revertida por implementação real).

## [0.4.0] - 2026-11-14

### Added

- `values: PivotValueField[]` de ponta a ponta: uma célula/total por medida,
  medida como nível mais interno do cabeçalho (ano → mês → medida), CSV/XLSX
  com uma coluna por medida e regras condicionais por `rule.field`/`rule.measure`.
- Ordenação por valor usando `sort.field` ou a primeira medida.
- Exemplo `docs/examples/multi-medida.md` e rota `/multi-medida` na demo.
- `PivotResult.grandTotals` (totais gerais por medida).

### Removed

- Diagnóstico `multiple-values-unsupported` (múltiplos valores agora são
  suportados).

## [0.3.1] - 2026-11-14

### Changed

- Pacote renomeado de `@leonardohessel/pivot-grid` para **`pivot-grid`**
  (sem escopo). Primeiro release do novo nome; o nome antigo fica congelado e
  sem suporte após a 1.0.

## [0.3.0] - 2026-11-14

### Added

- Colunas de rótulos (row headers) **sticky** no scroll horizontal, com largura
  configurável por `PivotField.width` (default 160px) e `stickyRowHeaders`.
- Navegação por teclado nas células de dados: setas, `Home`/`End`,
  `PageUp`/`PageDown`, com foco visível e `tabindex` móvel.
- Exemplo [`docs/examples/sticky-keyboard.md`](docs/examples/sticky-keyboard.md)
  e rota `/sticky-keyboard` na demo.
- Demo com uma rota por cenário (`/` básico e `/sticky-keyboard`).

### Changed

- README do pacote reescrito: quick start com `auxiliaryValues`/`rule.measure`,
  `labels`, `height`/`width` e export CSV/XLSX.
- Guia de integração (`docs/INTEGRATION.md`) com mapeamento da tela, gate de
  paridade e limitações.
- Política de releases documentada em `docs/RELEASES.md` e `docs/ROADMAP.md`.

### Removed

- `CsvExportOptions.mode` (`'visible' | 'full'`) — nunca implementado; a
  exportação sempre gera a matriz completa. Mudança de tipo pública
  (breaking em 0.x).

## [0.2.0] - 2026-11-14

### Added

- Writer **XLSX mínimo** sem dependência (ZIP + XML), com planilha, cabeçalho
  em negrito e painel congelado; exportação pelo componente (`exportExcel`).
- Benchmark do engine com 10.000 linhas × 12 meses, executado no CI
  (limite configurável por `BENCH_MAX_MS`).
- Workflow de deploy da demo no GitHub Pages.
- Botão de exportação Excel na demo.

## [0.1.0] - 2026-11-14

### Added

- Engine de pivot: linhas multi-nível, colunas dinâmicas, agregadores
  `sum/avg/min/max/count/countDistinct`, totais de linha/coluna/geral
  recalculados dos registros, ordenação estável, formatação `Intl`,
  formatação condicional e diagnósticos (`strict` com `PivotError`).
- Medidas auxiliares (`auxiliaryValues`) agregadas por célula e por total,
  com `ConditionalRule.measure`.
- Células de subárvore (`nodeCells`) para linhas colapsadas.
- Componente Angular `pg-pivot-grid` (standalone, OnPush):
  cabeçalho multi-nível, expandir/colapsar, totais, `width`/`height` com
  scroll interno, cabeçalho sticky, densidade e rótulos configuráveis.
- Exportação **CSV** nativa com proteção contra injeção de fórmula.
- Testes: engine (18) e componente (5).
- Licença MIT, `publishConfig.access = public` e workflow de publish por tag.



