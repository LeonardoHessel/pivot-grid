# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-11-14

### Added

- Writer **XLSX mínimo** sem dependência (ZIP + XML) com planilha, cabeçalho
  em negrito e exportacao pelo componente (xportExcel).
- Benchmark do engine com 10.000 linhas x 12 meses, executado no CI
  (limite configuravel por BENCH_MAX_MS).
- Workflow de deploy da demo no GitHub Pages.
- Botao de exportacao Excel na demo.

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



