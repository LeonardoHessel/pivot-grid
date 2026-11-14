# Integração no consumidor

Checklist para substituir a implementação antiga de pivot pelo
`@leonardohessel/pivot-grid` em um app Angular.

## Pré-requisitos

- App em **Angular 18, 19 ou 20** (a lib não suporta <18).
- Publicação verificada: `@leonardohessel/pivot-grid@0.2.0` (`latest`, MIT).

## Passo 1 — Instalação pinada

```bash
npm install --save-exact @leonardohessel/pivot-grid@0.2.0
```

Sem URL de git; a versão fica exata no `package.json`.

## Passo 2 — Substituir a tela de Giro por CDP

Mapeamento de configuração (dados planos vindos da API):

```ts
config: PivotConfig = {
  rows: [
    { field: 'region', caption: 'Região' },
    { field: 'mainTransitPointCode', caption: 'CDP Principal' },
    { field: 'transitPointCode', caption: 'CDP' },
  ],
  columns: [
    { field: 'year', caption: 'Ano' },
    { field: 'month', caption: 'Mês' },
  ],
  values: [{ field: 'weightedAverage', caption: 'Média Pod.', aggregator: 'avg' }],
  auxiliaryValues: [{ field: 'goalPercentage', aggregator: 'avg' }],
  conditionalRules: [
    {
      measure: 'goalPercentage',
      operator: '<=',
      value: 1,
      style: { backgroundColor: '#80cbc4', color: '#000' },
      applyToTotals: true,
    },
  ],
  showRowTotals: true,
  showColumnTotals: true,
  showGrandTotal: true,
  emptyText: '-',
  locale: 'pt-BR',
};
```

```html
<pg-pivot-grid
  [data]="rows"
  [config]="config"
  [labels]="labelsPtBr"
  height="1000px"
  width="100%">
</pg-pivot-grid>
```

## Passo 3 — Validar paridade (gate)

- [ ] Matriz: mesmos cruzamentos linha × coluna e mesmos valores.
- [ ] Totais de linha, coluna e geral conferem com a implementação antiga.
- [ ] Regra sobre `goalPercentage` aplicada nas células **e nos totais**.
- [ ] Células vazias exibindo `-`.
- [ ] Rótulos em pt-BR.
- [ ] Export **XLSX** abre no Excel/LibreOffice com cabeçalho e totais.
- [ ] Layout: largura 100%, altura fixa, scroll interno, sem toolbar/field list.

## Passo 4 — Remover a dependência antiga

Somente após o gate acima:

- remover imports/módulos do pacote anterior;
- remover o registro de licença;
- remover as dependências do `package.json` e rodar `npm install`;
- validar build + smoke da tela.

## Limitações conhecidas (fora do gate atual)

- Coluna de rótulos (row headers) **não é fixa** no scroll horizontal.
- Acessibilidade de teclado **parcial** (setas/roving tabindex ainda não
  implementados; expandir/colapsar via botão funciona).

## Rollback

Manter a implementação antiga atrás de uma flag/rota até o gate de paridade
ser aprovado; só então remover o código e as dependências.
