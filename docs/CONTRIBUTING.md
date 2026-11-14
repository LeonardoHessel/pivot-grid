# Contribuindo

## Pré-requisitos

- Node.js 20+ (recomendado 22)
- npm 10+
- Chrome (para testes Karma)

## Setup

```bash
git clone https://github.com/LeonardoHessel/pivot-grid.git
cd pivot-grid
npm install
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run build:lib` | Build de produção da biblioteca |
| `npm run start:demo` | Demo em `http://localhost:4300` |
| `npm test` | Testes de todas as projects |
| `ng test pivot-grid` | Testes da biblioteca |
| `ng build demo` | Build do demo |

## Estrutura

```
projects/pivot-grid/   # biblioteca publicada
  src/lib/             # componentes
  core/                # entry point secundário (engine puro)
projects/demo/         # aplicação de demonstração
docs/                  # especificação e guias
```

## Padrões de código

- TypeScript `strict`; sem `any` em API pública.
- Componentes `standalone` e `OnPush`.
- Nomes de classes/atributos com prefixo `pg`.
- CSS escopado no componente + variables para tema.
- Sem dependências de runtime novas sem discussão em issue.

## Commits

Conventional Commits:

```
feat(core): add avg aggregator
fix(component): keep focus after collapse
docs: clarify empty cell semantics
```

Escopos: `core`, `component`, `docs`, `demo`, `ci`.

## Testes

- Toda regra de negócio do engine precisa de teste unitário.
- Bugfix acompanha teste que falha antes e passa depois.
- Rodar `npm test` antes de abrir PR.

## Pull requests

1. Issue descrevendo o problema/feature.
2. Branch a partir de `main`.
3. PR pequeno, com descrição e evidência (teste/screenshot).
4. CI verde + revisão.

## Release

1. Atualizar `CHANGELOG.md` (ou release-please).
2. `npm version <major|minor|patch>` na raiz e na lib.
3. `npm run build:lib`.
4. `npm publish dist/pivot-grid --access public`.
5. Tag `vX.Y.Z` + release no GitHub.

## Licença

Ao contribuir, você concorda que a contribuição é licenciada sob MIT.
