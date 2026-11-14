# Roadmap

## Política de versões

- **Semver**: `MAJOR.MINOR.PATCH`.
- `0.x`: API pode mudar entre minor; sempre documentado no `CHANGELOG.md`.
- `1.0+`: quebra só em major.
- Faixa de Angular da v1: `>=18 <21`. A v2 será publicada para `>=21`.

## v0.1 — MVP

Objetivo: substituir com segurança um pivot simples em produção.

- [ ] Engine: `sum`, `avg`, `min`, `max`, `count`, `countDistinct`
- [ ] Linhas multi-nível e colunas dinâmicas
- [ ] Totais de linha, coluna e geral
- [ ] Expandir/colapsar com estado controlado
- [ ] Formatação numérica (`Intl`) e `emptyText`
- [ ] Formatação condicional (operadores + `predicate`)
- [ ] CSV nativo com proteção contra injeção de fórmula
- [ ] Componente standalone + `PivotModule` opcional
- [ ] Acessibilidade: roles, `aria-sort`, teclado básico
- [ ] Demo com dataset genérico
- [ ] CI: build + testes
- [ ] Docs: README, SPECIFICATION, API, ENGINE

## v0.2 — Qualidade

- [ ] Cobertura core ≥ 90%, componente ≥ 80%
- [ ] Testes de teclado e a11y
- [ ] Temas (light/dark) por CSS vars + `density`
- [ ] RTL
- [ ] Storybook ou demo com múltiplos cenários
- [ ] Benchmarks no CI (tempo do engine)

## v0.3 — Exportação e estado

- [ ] Adaptador de Excel documentado + exemplo
- [ ] `exportMode: 'visible' | 'full'`
- [ ] `getState`/`setState` estáveis
- [ ] `CHANGELOG.md` automatizado (release-please)

## v1.0 — Estável

- [ ] API congelada e documentada
- [ ] Publicação no npm com `@leonardohessel`
- [ ] GitHub Pages com demo
- [ ] Guias: temas, i18n, exportação, migração
- [ ] Compatibilidade testada em Angular 18, 19 e 20 (matriz de CI)

## v1.1 — Performance e múltiplos valores

- [ ] Virtualização de linhas/colunas
- [ ] Múltiplos valores por célula (`values[]`)
- [ ] Excel nativo (sem dependência externa)
- [ ] Ordenação por múltiplos critérios
- [ ] Filtros de eixo na UI

## v1.2 — Análise

- [ ] Painel de campos (drag-and-drop)
- [ ] Pivot chart
- [ ] Drill-down com eventos
- [ ] Exportação PDF

## v2.0 — Angular 21+

- [ ] Base em Angular `>=21`, zoneless por padrão
- [ ] Uso pleno de signals/recursos novos
- [ ] Possível reescrita do renderer com as APIs de controle de fluxo
- [ ] Compatibilidade com SSR/hydration
- [ ] Modo server-side (paginação/agregação no servidor)

## Critérios para 1.0

- Nenhum bug aberto de severidade alta.
- API revisada e sem `any` público.
- Documentação completa e demo publicada.
- Pelo menos um consumidor real validado.
