# pivot-grid

Componente de **tabela dinâmica (pivot)** para Angular: linhas multi-nível,
colunas dinâmicas, agregação, totais, formatação condicional e exportação.

- Angular nativo, **sem dependências de runtime** (além de `tslib`)
- Engine de agregação separado, testável e sem Angular (`pivot-grid/core`)
- Standalone component + `PivotModule` opcional
- Acessível (roles ARIA, teclado, `aria-sort`)
- Tema por CSS variables
- Licença **MIT**

> **Status:** engine (core) implementado e testado; componente Angular em implementação.

## Funcionalidades

| Recurso | v0.1 |
|---|---|
| Linhas em múltiplos níveis | ✅ planejado |
| Colunas dinâmicas | ✅ planejado |
| Agregação `sum/avg/min/max/count/countDistinct` | ✅ planejado |
| Totais de linha/coluna/geral | ✅ planejado |
| Expandir/colapsar com estado controlado | ✅ planejado |
| Ordenação por rótulo/valor | ✅ planejado |
| Formatação numérica (`Intl`) | ✅ planejado |
| Formatação condicional | ✅ planejado |
| Exportação CSV (nativa) | ✅ planejado |
| Exportação Excel (adaptador) | ✅ planejado |
| Virtualização | ⏳ v1.1 |
| Múltiplos valores | ⏳ v1.1 |
| Painel de campos / filtros | ⏳ v1.2 |

## Documentação

| Documento | Conteúdo |
|---|---|
| [Especificação](docs/SPECIFICATION.md) | Comportamento, regras, estados e critérios de aceite |
| [API](docs/API.md) | Tipos, inputs, outputs, métodos, tema e erros |
| [Engine](docs/ENGINE.md) | Algoritmos, complexidade e casos de borda |
| [Roadmap](docs/ROADMAP.md) | Versões e entregas |
| [Contribuindo](docs/CONTRIBUTING.md) | Setup, testes, commits e release |

## Uso (previsto para a v0.1)

```bash
npm install @leonardohessel/pivot-grid
```

```ts
import { PivotGridComponent, PivotConfig } from '@leonardohessel/pivot-grid';

@Component({
  standalone: true,
  imports: [PivotGridComponent],
  template: `
    <pg-pivot-grid [data]="rows" [config]="config"></pg-pivot-grid>
  `,
})
export class ReportComponent {
  rows = [
    { region: 'Sul', month: '2026-01', amount: 120 },
    { region: 'Norte', month: '2026-01', amount: 50 },
  ];

  config: PivotConfig = {
    rows: [{ field: 'region', caption: 'Região' }],
    columns: [{ field: 'month', caption: 'Mês' }],
    values: [{ field: 'amount', caption: 'Total' }],
    showColumnTotals: true,
    showGrandTotal: true,
  };
}
```

## Desenvolvimento

```bash
npm install
npm run build:lib      # compila a biblioteca
npm run start:demo     # demo em http://localhost:4300
npm test               # testes
```

## Compatibilidade

| Versão | Angular |
|---|---|
| v1 | `>=18 <21` |
| v2 (planejada) | `>=21` |

## Licença

MIT © Leonardo Hessel

