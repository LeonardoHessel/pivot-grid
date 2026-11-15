# Compatibilidade

## Versões suportadas

## Linha 1.x (estável)

| Angular | Situação | Como é validado |
|---|---|---|
| **18** | suportado | app consumidor criado no CI (`compat.yml` na `main`) |
| **19** | suportado | app consumidor criado no CI (`compat.yml` na `main`) |
| **20** | suportado | app consumidor criado no CI (`compat.yml` na `main`) |

## Linha 2.x (RC)

| Angular | Situação | Como é validado |
|---|---|---|
| **21** | RC | app consumidor no CI (`compat.yml` na branch `2.x`) |
| **22** | RC | app consumidor no CI (`compat.yml` na branch `2.x`) |

`peerDependencies` da 1.x: `>=18.0.0 <21.0.0`.
`peerDependencies` da 2.x: `>=21.0.0 <23.0.0`.

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
