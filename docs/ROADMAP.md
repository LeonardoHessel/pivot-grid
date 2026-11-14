# Roadmap

## Política de versões

- **Semver**; releases publicados **somente no npm** com versão pinada
  (consumidores não devem usar URL de git).
- v0.x: API pode mudar entre minor (documentado no `CHANGELOG.md`).
- v1.0+: quebra apenas em major.
- Faixa suportada na v1: Angular `>=18 <21`.

## Congelamento atual

- **0.2.0** é a baseline da integração e permanece latest no npm.
- Nenhuma publicação durante a janela de integração.
- Mudanças pendentes entram na **0.3.0** (ver CHANGELOG.md e RELEASES.md).

## v0.1.0 — Renderer

- [x] Componente `pg-pivot-grid` consumindo o engine
- [x] Cabeçalho multi-nível com `colspan`/`rowspan`
- [x] Expandir/colapsar com estado controlado
- [x] Totais de linha/coluna/geral
- [x] Células vazias (`emptyText`) e largura `100%`/altura configurável com scroll
- [x] Cabeçalho sticky
- [x] Rótulos pt-BR (`labels`)
- [x] Exportação **CSV** nativa
- [x] Testes do componente (render, expandir, teclado, CSV)
- [x] Demo com dataset sintético

## v0.2.0 — Excel, medidas auxiliares e performance

- [x] Writer **XLSX mínimo** sem dependência (ZIP + XML)
- [x] `auxiliaryValues` na API pública + `rule.measure` documentados e testados
- [x] Benchmark com volume sintético (ex.: 10k linhas × 12 meses)
- [x] Testes de medição no CI (tempo do engine)
- [x] Publicação da demo (GitHub Pages)

## Integração no consumidor — concluída

- [x] App em Angular 18+ (consumidor validado em Angular 19)
- [x] Instalar `--save-exact @leonardohessel/pivot-grid@0.2.0`
- [x] Trocar a tela de Giro por CDP
- [x] Validar paridade: matriz, totais, regra sobre `goalPercentage`
      (inclusive totais), `-`, pt-BR e export XLSX
- [x] Remover o pacote anterior e o registro de licença
- [x] Build de produção do consumidor: 2,29 MB (496 kB gzip); zip de deploy regenerado
- Limitações conhecidas fora do gate: coluna de rótulos não fixa e teclado parcial

## v0.3.0 — Qualidade e breaking changes

- [x] Remover `CsvExportOptions.mode` (breaking em 0.x)
- [x] README do pacote reescrito
- [ ] Publicar 0.3.0 (sem urgência; somente após a janela de integração)

- [x] Remover CsvExportOptions.mode (breaking em 0.x)
- [x] README do pacote reescrito
- [ ] Publicar 0.3.0 somente após a integração

- [ ] Cobertura core ≥ 90%, componente ≥ 80%
- [ ] Acessibilidade completa (teclado, `aria-sort`, foco)
- [ ] Temas light/dark e RTL
- [ ] Adaptador de Excel externo (opcional)

## v1.0.0 — Estável

- [ ] API congelada e documentada
- [ ] Compatibilidade testada em Angular 18, 19 e 20 (matriz de CI)
- [ ] Guias: temas, i18n, exportação, migração

## v1.1.0 — Performance e múltiplos valores

- [ ] Virtualização
- [ ] Múltiplos valores por célula
- [ ] Filtros de eixo

## v2.0.0 — Angular 21+ (futuro)

- [ ] Base em Angular `>=21`, zoneless
- [ ] Uso pleno das APIs novas
- [ ] SSR/hydration
- [ ] Modo server-side




