# pivot-grid

Componente de **tabela dinâmica (pivot)** para Angular: linhas multi-nível,
colunas dinâmicas, agregação, totais, formatação condicional e exportação.

- Angular nativo, **sem dependências de runtime** (além de `tslib`)
- Engine de agregação separado, testável e sem Angular (`src/lib/core`, exportado pelo pacote)
- Standalone component + `PivotModule` opcional
- Acessível (roles ARIA, teclado, `aria-sort`)
- Tema por CSS variables
- Licença **MIT**

> **Status:** **2.1.0 estável** (`latest`) para Angular 21+ (zoneless/SSR), com colunas redimensionáveis. A linha 1.x (1.2.0) segue disponível para Angular 18–20.

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
| Coluna de rótulos fixa + teclado (setas/Home/End/PageUp/Down) | ✅ main (0.3.0) |
| Rótulos pt-BR (`labels`) | ✅ implementado |
| Exportação CSV nativa | ✅ implementado |
| Exportação Excel (XLSX mínimo) | ✅ implementado |
| Virtualização (`virtualScroll`, 50k) | ✅ 0.5.0 |
| Hardening (a11y axe, matriz 18/19/20, orçamentos) | ✅ 0.6.0 |
| Filtros por eixo + hierarquia de datas | ✅ 1.1.0 |
| Templates de célula e cabeçalho | ✅ 1.2.0 |
| Linha 2.x (Angular 21+, zoneless, SSR/hydration) | ✅ 2.0.0 estável |
| Colunas redimensionáveis (2.1) | ✅ 2.1.0 |
| Múltiplos valores (`values[]`) | ✅ 0.4.0 |
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
| [Releases](docs/RELEASES.md) | Regras, gate e passo a passo de publicação |
| [Migração](docs/MIGRATION.md) | Rename e remoções da 0.9.0 |
| [Migração 2.x](docs/MIGRATION-2.md) | Plano 1.x → 2.x (Angular 21+) |
| [Compatibilidade](docs/COMPATIBILITY.md) | Angular 18/19/20 e toolchain |
| [Performance](docs/PERFORMANCE.md) | Orçamentos de 10k/50k no CI |
| [Exemplos](docs/examples/README.md) | Um exemplo por funcionalidade (sticky/teclado) |

## Uso

```bash
npm install --save-exact pivot-grid@2.1.0
```

> `latest` aponta para a 2.0.0 (Angular 21+); a 1.2.0 atende Angular 18–20.

```ts
import { PivotGridComponent, PivotConfig } from 'pivot-grid';

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

## Demo

- Básico: <https://leonardohessel.github.io/pivot-grid/>
- Sticky + teclado: <https://leonardohessel.github.io/pivot-grid/sticky-keyboard>
- Multi-medida: <https://leonardohessel.github.io/pivot-grid/multi-medida>
- Virtualização: <https://leonardohessel.github.io/pivot-grid/virtualizacao>
- Filtros + datas: <https://leonardohessel.github.io/pivot-grid/filtros>
- Templates: <https://leonardohessel.github.io/pivot-grid/templates>
- Colunas: <https://leonardohessel.github.io/pivot-grid/colunas>

## Distribuição

- Demo publicada em https://leonardohessel.github.io/pivot-grid/ (GitHub Pages).
- Publicação **somente no npm**, com versão pinada no consumidor
  (`npm install --save-exact pivot-grid@2.1.0`); sem URL de git.
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




















