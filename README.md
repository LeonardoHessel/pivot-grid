# pivot-grid

Componente de **tabela dinâmica (pivot)** para Angular: linhas multi-nível,
colunas dinâmicas, agregação, totais, formatação condicional e exportação.

- Angular nativo, **sem dependências de runtime** (além de `tslib`)
- Engine de agregação separado, testável e sem Angular (`src/lib/core`, exportado pelo pacote)
- Standalone component + `PivotModule` opcional
- Acessível (roles ARIA, teclado, `aria-sort`)
- Tema por CSS variables
- Licença **MIT**

> **Status:** v0.2.0 publicada no npm (latest), com CSV, XLSX, benchmark e demo.

## Funcionalidades

| Recurso | Status |
|---|---|
| Linhas multi-nível e colunas dinâmicas (engine) | ✅ implementado |
| Agregação e totais (engine) | ✅ implementado |
| Ordenação estável (rótulo/valor) | ✅ implementado |
| Formatação numérica (`Intl`) | ✅ implementado |
| Formatação condicional + medidas auxiliares | ✅ implementado |
| Renderer Angular + expandir/colapsar | ✅ implementado |
| `height`/`width` + scroll + header sticky | ✅ implementado |
| Rótulos pt-BR (`labels`) | ✅ implementado |
| Exportação CSV nativa | ✅ implementado |
| Exportação Excel (XLSX mínimo) | ✅ implementado |
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
| [Integração](docs/INTEGRATION.md) | Checklist de adoção no app consumidor |
| [Contribuindo](docs/CONTRIBUTING.md) | Setup, testes, commits e release |

## Uso

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

## Distribuição

- Demo publicada em https://leonardohessel.github.io/pivot-grid/ (GitHub Pages).
- Publicação **somente no npm**, com versão pinada no consumidor
  (`npm install @leonardohessel/pivot-grid@0.1.0`); sem URL de git.
- Release por tag `vX.Y.Z` (workflow `publish.yml`), com
  `publishConfig.access = public` e checagem de versão da tag.
- Licença MIT (`LICENSE` na raiz e no pacote).

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








