# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

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


