# Roadmap

## Linhas de release

| Linha | Angular | Versão atual | Estado |
|---|---|---|---|
| **2.x** | 21, 22 | **2.4.0** (`latest`) | ativa; tooltip no hover |
| **1.x** | 18, 19, 20 | **1.2.0** | congelada; manutenção |

- Novas features entram **somente na 2.x**, uma funcionalidade-título por minor.
- A 1.x não recebe features novas.
- Breaking só em major; a 2.x é aditiva.

## Histórico publicado

| Versão | Título |
|---|---|
| 0.1.0 | Engine + renderer + CSV |
| 0.2.0 | XLSX mínimo, benchmark, Pages |
| 0.3.0 | Sticky row headers + teclado |
| 0.4.0 | Múltiplos valores |
| 0.5.0 | Virtualização + export `visible/full` |
| 0.6.0 | Hardening (axe, matriz 18/19/20, orçamentos) |
| 0.9.0 | RC (API congelada) |
| 1.0.0 | Estável |
| 1.1.0 | Filtros + hierarquia de datas |
| 1.2.0 | Templates de célula/cabeçalho |
| 2.0.0 | Angular 21+, zoneless, SSR/hydration |
| 2.1.0 | Colunas redimensionáveis |
| 2.1.1 | Documentação (sem código) |
| 2.2.0 | Cabeçalho de linha em árvore + showValueHeader |
| 2.3.0 | Contrato de tema + drill-down |
| 2.4.0 | Tooltip de célula no hover (diálogo opcional) |

## 2.x — próximas minors (aditivas)

Uma funcionalidade-título por minor; sem quebrar a API existente:

| Versão | Funcionalidade |
|---|---|
| **2.4** | Reordenar e fixar colunas (`PivotState.columnOrder`/`pinned`, eventos) |
| **2.5** | Campos calculados (fórmulas declarativas) |
| **2.6** | Pivot chart |
| **2.7** | Exportação PDF |
| **2.8** | Modo server-side |

Nenhum tipo/input especulativo é criado antes da implementação da respectiva
minor.

**Backlog:** resolvedor de tooltip por célula/grupo (cellTooltip) — não
implementado na 2.4.0.

## Escopo fechado da 1.0/2.0

- Linhas multi-nível, colunas dinâmicas, múltiplos valores.
- Agregadores, totais e ordenação.
- Formatação numérica/condicional com medidas auxiliares.
- Filtros, hierarquia de datas e templates.
- Virtualização e export CSV/XLSX.
- Sticky headers e teclado.
- Matriz de compatibilidade e orçamentos de performance.

## Fora de escopo

- Novas features na 1.x.
- Mudanças de API na 2.x que quebrem consumidores existentes.


