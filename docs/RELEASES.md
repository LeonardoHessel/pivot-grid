# Política de releases

## Baseline congelada: 0.2.0

- `@leonardohessel/pivot-grid@0.2.0` é a **baseline da integração**.
- Permanece como `latest` no npm durante toda a janela de integração.
- **Nenhuma publicação** deve ocorrer enquanto a integração estiver em andamento
  (nem patch, nem prerelease).
- Consumidores instalam com versão exata (`--save-exact`), nunca por URL de git.

## Próximo release funcional: 0.3.0

Mudanças já presentes no `main` e que **não** serão publicadas antes da 0.3.0:

- **Breaking (0.x)**: remoção de `CsvExportOptions.mode`
  (`'visible' | 'full'`), que nunca foi implementado — exportação sempre gera a
  matriz completa.
- README do pacote reescrito (quick start, exemplos com `auxiliaryValues`,
  `rule.measure`, `labels`, `height`/`width` e export CSV/XLSX).

## Exceção: correção de tipos antes da integração

Somente se for **absolutamente necessário** corrigir tipos antes do gate:

1. publicar **0.2.1** (patch) com a correção mínima;
2. avisar imediatamente para **re-pinar** a versão no consumidor;
3. registrar a mudança no `CHANGELOG.md`.

Fora desse caso, nenhuma versão é publicada durante a integração.

## Processo de publicação

1. Atualizar `CHANGELOG.md` e a versão em `package.json` (raiz e lib).
2. `npm run build:lib`.
3. Criar a tag `vX.Y.Z` e enviá-la.
4. O workflow `publish.yml` valida `tag == version` e publica com
   `--access public --provenance`.

Publish manual não faz parte do processo. Tags de versões já publicadas
(`v0.1.0`, `v0.2.0`) não devem ser reutilizadas.
