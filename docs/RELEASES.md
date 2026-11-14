# Política de releases

## Regras

- **Uma funcionalidade-título por minor**; correções e docs podem acompanhar.
- Toda minor é publicada **assim que o gate fecha** — não acumular mudanças
  não publicadas.
- Publicação **somente por tag** `vX.Y.Z`; nunca por push em `main`.
- `latest` aponta para a estável; `next` para o RC.
- Breaking: permitido em minor enquanto `0.x`; após a 1.0, apenas em major com
  depreciação prévia.
- `peerDependencies`: `>=18 <21` até a 1.0; `2.0.0` com `>=21`.
- **Não publicar patch** durante janela de integração de consumidor.

## Gate de release

Uma versão só é publicada quando **todos** os itens estiverem prontos:

- [ ] testes verdes (engine + componente + benchmark);
- [ ] `docs/API.md` atualizada;
- [ ] exemplo em `docs/examples/` da funcionalidade;
- [ ] demo com rota do cenário, linkada no README;
- [ ] `CHANGELOG.md` com a seção da versão (e `[Unreleased]` vazia);
- [ ] versão bumpada em `package.json` (raiz e lib);
- [ ] CI da tag verde;
- [ ] `npm view` conferido após o publish.

## Passo a passo

```bash
# 1. fechar docs/exemplos/demo e bump
# projects/pivot-grid/package.json = X.Y.Z

# 2. validar localmente
npm ci
npm run build:lib
npm test
npm run bench

# 3. commit de release
git add -A
git commit -m "chore(release): X.Y.Z"
git push origin main

# 4. tag e publish (workflow)
git tag vX.Y.Z
git push origin vX.Y.Z

# 5. conferir
npm view @leonardohessel/pivot-grid version
```

O workflow `publish.yml` valida `tag == version` e publica
`./dist/pivot-grid` com `--access public --provenance`. Publish manual não faz
parte do processo.

## RC e estável

- **0.9.0 (RC)**: publicar com dist-tag `next`
  (`npm publish ... --tag next`), API congelada e guia de migração.
- **1.0.0**: publicar como `latest`, sem features novas, com matriz de
  compatibilidade 18/19/20 e docs congeladas.

## Exceção

Correção de tipos urgente antes de uma integração: publicar **patch** apenas
com a correção mínima, avisar para re-pinar e registrar no `CHANGELOG.md`.
Fora disso, nenhuma publicação fora do gate.
