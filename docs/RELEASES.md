# Política de releases

## Nome do pacote

- Nome atual: **`pivot-grid`** (sem escopo).
- O nome antigo `@leonardohessel/pivot-grid` está **congelado** e deprecado;
  não recebe novas versões e sai do suporte após a 1.0.

## Linhas de release

| Linha | Angular | Estado | Onde vive |
|---|---|---|---|
| **2.x** (`latest`) | 21, 22 | ativa | branch `2.x` |
| **1.x** | 18, 19, 20 | manutenção (1.2.0) | branch `main` |

- Novas features entram **somente na 2.x**, uma funcionalidade-título por minor.
- A 1.x recebe apenas correções críticas/compatibilidade, sem features novas.

## Regras

- **Uma funcionalidade-título por minor**; correções e docs podem acompanhar.
- Toda minor é publicada **assim que o gate fecha** — não acumular.
- Publicação **somente por tag** `vX.Y.Z`; nunca por push em branch.
- `latest` aponta para a estável da 2.x; `next` para RC/pré-release.
- Breaking só em **major**; a 2.x é aditiva e não quebra a API da 1.x.
- Versões antigas continuam instaláveis (ex.: `pivot-grid@1.2.0`).

## Versionamento e dist-tags

- Tag `vX.Y.Z` sem sufixo → publica em `latest`.
- Tag `vX.Y.Z-rc.N` (ou `v0.9.*`) → publica em `next`.
- O `publish.yml` é **idempotente**: se a versão já existe, não republica e
  apenas valida a `dist-tag` esperada.

## Gate de release

Uma versão só é publicada quando **todos** os itens estiverem prontos:

- [ ] testes verdes (engine + componente + a11y + benchmark);
- [ ] `docs/API.md` atualizada;
- [ ] exemplo em `docs/examples/` da funcionalidade;
- [ ] demo com rota do cenário, linkada no README;
- [ ] `CHANGELOG.md` com a seção da versão (e `[Unreleased]` vazia);
- [ ] versão bumpada em `package.json` (raiz e lib);
- [ ] CI da tag verde;
- [ ] matriz de compatibilidade da linha verde
      (1.x: 18/19/20 na `main`; 2.x: 21/22 na `2.x`);
- [ ] orçamentos de performance (10k/50k) verdes;
- [ ] `npm view pivot-grid dist-tags` conferido após o publish.

## Passo a passo (2.x)

```bash
# 1. fechar docs/exemplos/demo e bump
#    projects/pivot-grid/package.json = X.Y.Z

# 2. validar localmente
npm ci
npm run build:lib
npm test
npm run bench
npm run verify:package

# 3. commit de release
git add -A
git commit -m "chore(release): X.Y.Z"
git push origin 2.x

# 4. tag e publish (workflow OIDC)
git tag vX.Y.Z
git push origin vX.Y.Z

# 5. conferir
npm view pivot-grid dist-tags
npm view pivot-grid version
```

## RC e estável

- **RC** (`X.Y.Z-rc.N`): publicar em `next`, validar no consumidor e só então
  promover a estável.
- **Estável**: publicar em `latest` com a matriz da linha e docs atualizadas.
- A `latest` só muda após o gate da versão estável.

## Exceção

Correção de tipos urgente: publicar **patch** apenas com a correção mínima,
avisar para re-pinar e registrar no `CHANGELOG.md`. Fora disso, nenhuma
publicação fora do gate.
