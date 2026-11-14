# Roadmap

## Política de versões

- **Semver**; releases publicados **somente no npm** com versão pinada
  (consumidores não devem usar URL de git).
- v0.x: API pode mudar entre minor (documentado no `CHANGELOG.md`).
- v1.0+: quebra apenas em major.
- Faixa suportada na v1: Angular `>=18 <21`.

## v0.1.0 — Renderer

- [ ] Componente `pg-pivot-grid` consumindo o engine
- [ ] Cabeçalho multi-nível com `colspan`/`rowspan`
- [ ] Expandir/colapsar com estado controlado
- [ ] Totais de linha/coluna/geral
- [ ] Células vazias (`emptyText`) e largura `100%`/altura configurável com scroll
- [ ] Cabeçalho sticky
- [ ] Rótulos pt-BR (`labels`)
- [ ] Exportação **CSV** nativa
- [ ] Testes do componente (render, expandir, teclado, CSV)
- [ ] Demo com dataset sintético

## v0.2.0 — Excel, medidas auxiliares e performance

- [ ] Writer **XLSX mínimo** sem dependência (ZIP + XML)
- [ ] `auxiliaryValues` na API pública + `rule.measure` documentados e testados
- [ ] Benchmark com volume sintético (ex.: 10k linhas × 12 meses)
- [ ] Testes de medição no CI (tempo do engine)
- [ ] Publicação da demo (GitHub Pages)

## v0.3.0 — Qualidade

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
