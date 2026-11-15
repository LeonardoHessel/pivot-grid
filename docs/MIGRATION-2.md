# Migração 1.x → 2.x (Angular 21+)

> **Status:** planejamento. A 2.0.0 só é publicada quando o consumidor estiver
> pronto para o Angular 21; o gatilho é coordenado com o consumidor.

## Objetivo

Suportar Angular **21+** com peer `>=21 <22`, mantendo a API pública estável da
1.x sempre que possível. Mudanças de contrato só entram em 2.0 e são listadas
aqui.

## Escopo planejado

- `peerDependencies` de `@angular/core`/`@angular/common` para `>=21 <22`.
- **Zoneless** como modo padrão; remover dependência de `NgZone`.
- SSR/hydration: nenhum acesso a `window`/`document` em tempo de construção,
  medições somente no browser, `afterNextRender` onde necessário.
- Revisão de APIs modernas do Angular 21 (control flow, signals, standalone).
- Limpeza de APIs internas que não fazem mais sentido.
- Matriz de compatibilidade 21+ no CI.

## Passos previstos

1. validar a 1.x com o consumidor no Angular 20 (linha atual);
2. quando o consumidor planejar o Angular 21, cortar a branch `2.x`;
3. subir peers/toolchain para Angular 21, rodar matriz de CI;
4. substituir `NgZone` por estratégias zoneless e validar eventos/scroll;
5. habilitar SSR/hydration no demo e validar;
6. congelar API 2.0, publicar RC com `next` e depois `latest`;
7. atualizar este guia com o diff final 1.x → 2.x.

## Compatibilidade

| Item | 1.x | 2.x |
|---|---|---|
| Angular | `>=18 <21` | `>=21 <22` |
| Zoneless | opcional | padrão |
| SSR/hydration | não suportado oficialmente | suportado |
| API | congelada na 1.0 | congelada na 2.0 |

## O que não muda

- Nome do pacote (`pivot-grid`), licença MIT e formato de distribuição.
- Modelo de dados (`PivotConfig`, `PivotResult`) e exports públicos, salvo
  remoções explicitamente documentadas na 2.0.
