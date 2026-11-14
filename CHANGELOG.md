# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

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


