# Performance

## Orçamentos (enforced no CI)

| Cenário | Orçamento | Variável |
|---|---|---|
| Engine, 10.000 linhas × 12 meses | **≤ 500 ms** | `BENCH_MAX_MS` |
| Engine, 50.000 linhas × 12 meses | **≤ 2.500 ms** | `BENCH_MAX_50K_MS` |

Mediana de 3 execuções, após warm-up. O CI falha se qualquer cenário exceder o
orçamento.

Referência local (notebook 4 núcleos): ~19 ms (10k) e ~57 ms (50k).

## Como rodar

```bash
npm run bench
```

Saída: JSON com `label`, `rows`, `runsMs`, `medianMs` e `limitMs` por cenário.

## Virtualização

- Com `virtualScroll`, apenas a janela visível vai para o DOM (spacers
  preservam a altura total).
- O exemplo `/virtualizacao` cobre 50.000 linhas com altura fixa.
- O orçamento acima mede o **engine**; o renderer é coberto por testes de
  componente (janela virtual, spacers, sticky headers).

## Metas de render (não automatizadas)

| Cenário | Meta |
|---|---|
| Render inicial, 1.000 linhas visíveis × 12 colunas | ≤ 200 ms |
| Expandir um nó | ≤ 16 ms (sem re-agregar) |
