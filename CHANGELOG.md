# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Engine de pivot (`@leonardohessel/pivot-grid/core`): linhas multi-nível,
  colunas dinâmicas, agregadores `sum/avg/min/max/count/countDistinct`,
  totais de linha/coluna/geral, ordenação estável, formatação `Intl`,
  formatação condicional e diagnósticos (`strict` com `PivotError`).
- Medidas auxiliares (`auxiliaryValues`) agregadas por célula e
  `rule.measure` para regras condicionais sobre uma segunda medida.
- Licença MIT e `publishConfig.access = public`.
- Workflow de publicação por tag.

### Planned

- v0.1.0: renderer Angular, CSV, `height`/`width`, rótulos e testes.
- v0.2.0: Excel nativo (XLSX mínimo), medidas auxiliares na API pública,
  benchmark e demo publicada.
