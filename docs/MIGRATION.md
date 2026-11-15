# Guia de migração

## 1. Nome do pacote

O pacote passou a ser **`pivot-grid`** (sem escopo).

```diff
- npm install @leonardohessel/pivot-grid@0.3.1
+ npm install pivot-grid@0.9.0
```

O nome antigo `@leonardohessel/pivot-grid` está **deprecado**, não recebe novas
versões e sai do suporte após a **1.0**. Lockfiles antigos continuam válidos;
apenas não haverá atualizações.

```diff
- import { PivotGridComponent } from '@leonardohessel/pivot-grid';
+ import { PivotGridComponent } from 'pivot-grid';
```

## 2. 0.6.0 → 0.9.0 (RC)

As APIs deprecadas na 0.6.0 foram removidas. Nada além disso mudou.

### `grandTotal` → `grandTotals`

```diff
- const total = result.grandTotal?.value;
+ const total = result.grandTotals.get('amount')?.value;
```

### `totalsPosition` / `alwaysShowRowTotals`

Removidos. Totais continuam sendo renderizados ao final da tabela.

```diff
- totalsPosition: 'start',
- alwaysShowRowTotals: true,
```

### `PivotField.align`

Removido; use CSS/`formatter` para alinhamento.

```diff
- rows: [{ field: 'region', align: 'left' }]
+ rows: [{ field: 'region' }]
```

### `ConditionalRule.target`

Removido; regras são avaliadas por célula (`cell`).

```diff
- conditionalRules: [{ target: 'row', operator: '>', value: 10 }]
+ conditionalRules: [{ operator: '>', value: 10 }]
```

### `PivotGridComponent.refresh()`

Removido; os inputs são signals e a matriz é recalculada automaticamente.

```diff
- this.grid.refresh();
```

## 3. Checklist de upgrade

- [ ] trocar dependência/imports para `pivot-grid`;
- [ ] substituir `grandTotal` por `grandTotals`;
- [ ] remover `totalsPosition`, `alwaysShowRowTotals`, `align`, `target` e
      chamadas a `refresh()`;
- [ ] rodar `npm install` e o build;
- [ ] validar export CSV/XLSX e regras condicionais;
- [ ] rodar o app nas versões suportadas (Angular 18, 19 ou 20).

## 4. Versões

| Versão | Situação |
|---|---|
| 0.6.0 | estável anterior |
| 0.9.0 | RC (dist-tag `next`) |
| 1.0.0 | **estável** (`latest`) |
