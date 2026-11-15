# Contribuindo

## Pré-requisitos

- Node.js `>=20.19` (recomendado 22)
- npm 11 (`packageManager`)
- Chrome (testes Karma)

## Setup

```bash
git clone https://github.com/LeonardoHessel/pivot-grid.git
cd pivot-grid
npm ci
```

## Branches

| Branch | Linha | Angular |
|---|---|---|
| `main` | 1.x (manutenção, 1.2.0) | 18–20 |
| `2.x` | 2.x (ativa) | 21–22 |

Features novas entram na `2.x`, uma por minor. Correções críticas podem ir para
a linha correspondente.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run build:lib` | build de produção da biblioteca |
| `npm run start:demo` | demo em `http://localhost:4300` |
| `npm test` | testes da biblioteca |
| `npm run bench` | benchmark 10k/50k (orçamentos) |
| `npm run verify:package` | valida nome/versão/tag/LICENSE + `npm pack` |

## Estrutura

```
projects/pivot-grid/   # biblioteca publicada
  src/lib/core/        # engine puro (sem Angular)
  src/lib/             # componente e templates
projects/demo/         # demo com uma rota por cenário
docs/                  # especificação, API, guias e exemplos
scripts/               # benchmark, verificação e consumidor de compatibilidade
```

A superfície pública é apenas `projects/pivot-grid/src/public-api.ts`; os
`exports` do pacote bloqueiam deep imports.

## Padrões

- TypeScript `strict`; sem `any` em API pública.
- Componentes `standalone` e `OnPush`; inputs/outputs via signals.
- Prefixo `pg` em classes/seletores.
- CSS escopado + CSS variables para tema.
- Sem dependências de runtime novas sem discussão em issue.

## Commits

Conventional Commits, com escopo:

```
feat(component): add column resizing
fix(core): keep totals on filtered rows
docs: update compatibility matrix
ci: use npm 11 in workflows
```

## Testes

- Regras de negócio do engine precisam de teste unitário.
- Bugfix acompanha teste que falha antes e passa depois.
- `npm test` e `npm run bench` antes do PR.

## Release

Siga [`RELEASES.md`](./RELEASES.md): gate, bump, commit de release, tag e
workflow OIDC. Não publique manualmente.

## Licença

Ao contribuir, você concorda que a contribuição é licenciada sob MIT.
