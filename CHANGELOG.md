# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased] — alvo 0.3.0

> **Congelamento:** a versão **0.2.0** permanece como baseline da integração e
> `latest` no npm. Nada é publicado durante a janela de integração. Ver
> [`docs/RELEASES.md`](docs/RELEASES.md).

### Changed

- README do pacote reescrito: quick start com `auxiliaryValues`/`rule.measure`,
  `labels`, `height`/`width` e export CSV/XLSX.
- Guia de integração (`docs/INTEGRATION.md`) com mapeamento da tela, gate de
  paridade e limitações.

### Removed

- `CsvExportOptions.mode` (`'visible' | 'full'`) — nunca implementado; a
  exportação sempre gera a matriz completa. Mudança de tipo pública
  (breaking em 0.x), portanto entra na **0.3.0**, não em patch.

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
