# Compatibilidade

## Linhas

| Linha | Angular | Versão atual | Situação |
|---|---|---|---|
| **2.x** | 21, 22 | **2.3.0** (`latest`) | estável; tema + drill-down |
| **1.x** | 18, 19, 20 | **1.2.0** | manutenção; sem novas features |

`peerDependencies`:

- 2.x: `@angular/core` e `@angular/common` **`>=21 <23`**.
- 1.x: `@angular/core` e `@angular/common` **`>=18 <21`**.

## Toolchain por linha

| Item | 2.x (`2.x`) | 1.x (`main`) |
|---|---|---|
| Angular CLI | 21 | 18 |
| TypeScript | 5.9 | 5.5 |
| ng-packagr | 21 | 18 |
| Node.js | `>=20.19` (CI 22) | `>=20.19` (CI 22) |
| npm | 11 (`packageManager`) | 11 |
| Build | Ivy partial + `fesm2022` | Ivy partial |

## Matriz de CI

- **1.x** (`compat.yml` na `main`): apps consumidores Angular **18, 19 e 20**.
- **2.x** (`compat.yml` na `2.x`): apps consumidores Angular **21 e 22**.

Cada job:

1. build da biblioteca e `npm pack`;
2. `ng new consumer` com o CLI da major;
3. instalação do tarball no consumidor;
4. componente consumindo `<pg-pivot-grid>` com dados e configuração reais;
5. `ng build` do consumidor.

## Zoneless e SSR

- A linha 2.x é **zoneless por padrão** na demo e suporta **SSR/hydration**
  (`@angular/ssr`, `outputMode: server`, prerender de rotas estáticas).
- O componente não depende de `NgZone` e não acessa `window`/`document` na
  construção.

