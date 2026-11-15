# Compatibilidade

## Versões suportadas

| Angular | Situação | Como é validado |
|---|---|---|
| **18** | suportado | app consumidor criado no CI (`compat.yml`) |
| **19** | suportado | app consumidor criado no CI (`compat.yml`) |
| **20** | suportado | app consumidor criado no CI (`compat.yml`) |
| 21+ | planejado | linha **2.x** (sem data) |

`peerDependencies`: `@angular/core` e `@angular/common` `>=18.0.0 <21.0.0`.

## Toolchain de desenvolvimento

| Item | Versão |
|---|---|
| Node.js | `>=20.19` (CI usa 22) |
| npm | `11.x` (`packageManager: npm@11.15.0`) |
| TypeScript | 5.5 |
| Build | Angular CLI 18 + ng-packagr (Ivy partial) |

## Matriz de CI

O workflow `compat.yml` roda para cada major (18, 19, 20):

1. build da biblioteca e `npm pack`;
2. `ng new consumer` com o CLI da major;
3. instalação do tarball no consumidor;
4. componente consumindo `<pg-pivot-grid>` com dados e configuração reais;
5. `ng build` do consumidor.

Isso garante que o pacote publicado (compilado em Ivy partial) é consumível
pelas três majors suportadas.
