# Roadmap

## Política

- Uma **funcionalidade-título por minor**; correções/docs podem acompanhar.
- Toda minor é **publicada assim que o gate fecha** — não acumular.
- Publicação **somente por tag** (`vX.Y.Z`), nunca por push em `main`.
- `latest` = estável; `next` = RC.
- `peerDependencies`: `>=18 <21` até a 1.0; **2.0** com `>=21`.
- Breaking só em minor enquanto `0.x`; após a 1.0, apenas em major com
  depreciação prévia.
- Gate e passo a passo em [`RELEASES.md`](./RELEASES.md).

## Sequência

| Versão | Funcionalidade-título | Entregáveis |
|---|---|---|
| **0.3.0** | Sticky + teclado | row headers fixos, navegação por teclado, remoção de `CsvExportOptions.mode`, exemplo `sticky-keyboard` e rota na demo |
| **0.4.0** | Múltiplos valores ✅ | `values[]` com cabeçalho por medida, exemplo `multi-medida` |
| **0.5.0** | Virtualização | linhas virtualizadas + export `visible/full`, exemplo com 50k linhas |
| **0.6.0** | Hardening | revisão de API/deprecações, a11y com axe, matriz CI 18/19/20, orçamentos de performance (sem feature nova) |
| **0.9.0** | RC | API congelada, guia de migração, dist-tag `next` |
| **1.0.0** | Estável | sem features novas; matriz de compatibilidade e docs congeladas |
| **1.x** | Pós-1.0 | um por minor: painel de campos/filtros, pivot chart, PDF, server-side |
| **2.0.0** | Angular 21+ | base `>=21`, zoneless, SSR/hydration |

## Escopo fechado da 1.0

- Linhas multi-nível e colunas dinâmicas.
- `sum/avg/min/max/count/countDistinct` e múltiplos valores.
- Totais de linha/coluna/geral.
- Expandir/colapsar com estado controlado.
- Ordenação por rótulo/valor.
- Formatação numérica e condicional (com medidas auxiliares).
- CSV e XLSX nativos (com modo `visible`/`full`).
- Cabeçalho e colunas de rótulos fixos; navegação por teclado.
- Acessibilidade validada com axe.
- Angular 18, 19 e 20 na matriz de CI.
- Orçamentos de performance documentados.
- Docs congeladas: API, exemplos por funcionalidade, guia de migração.

## Fora da 1.0

- Painel de campos/filtros, pivot chart, PDF e server-side (entram em 1.x).
- Angular 21+ (2.0).
