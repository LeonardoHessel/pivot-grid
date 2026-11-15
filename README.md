# pivot-grid

Componente de **tabela dinâmica (pivot)** para Angular: linhas multi-nível,
colunas dinâmicas, múltiplos valores, agregação, totais, filtros, hierarquia de
datas, templates, virtualização e exportação CSV/XLSX.

- Angular nativo, **sem dependências de runtime** (além de `tslib`)
- Engine de agregação separado, testável e sem Angular (`src/lib/core`)
- Standalone component, `OnPush`, API baseada em signals
- Acessível (roles ARIA, navegação por teclado, expandir/colapsar, auditoria axe)
- Tema por CSS variables
- Licença **MIT**

## Linhas suportadas

| Linha | Angular | Versão atual | Situação |
|---|---|---|---|
| **2.x** | **21 e 22** (`>=21 <23`) | **2.1.1** (`latest`) | zoneless + SSR/hydration |
| **1.x** | **18, 19 e 20** (`>=18 <21`) | **1.2.0** | manutenção; sem novas features |

> **Status:** **2.1.1 estável** (`latest`) para Angular 21+, com colunas
> redimensionáveis. A 2.1.1 é **somente documentação** (sem mudança de código).
> A 1.2.0 segue publicada para Angular 18–20.

## Funcionalidades

| Recurso | Situação |
|---|---|
| Linhas multi-nível e colunas dinâmicas | ✅ |
| Agregação `sum/avg/min/max/count/countDistinct` | ✅ |
| Múltiplos valores (`values[]`) | ✅ 0.4.0 |
| Totais de linha/coluna/geral | ✅ |
| Expandir/colapsar com estado controlado | ✅ |
| Ordenação estável (rótulo/valor) | ✅ |
| Formatação numérica (`Intl`) e condicional | ✅ |
| Medidas auxiliares (`auxiliaryValues`/`rule.measure`) | ✅ |
| Filtros por eixo + hierarquia de datas | ✅ 1.1.0 |
| Templates de célula e cabeçalho | ✅ 1.2.0 |
| Colunas redimensionáveis (alça, teclado, reset) | ✅ 2.1.0 |
| Virtualização de linhas (`virtualScroll`, 50k) | ✅ 0.5.0 |
| Exportação CSV e XLSX (sem dependência) | ✅ |
| `height`/`width`, scroll interno, headers sticky | ✅ |
| Rótulos pt-BR (`labels`) | ✅ |
| Zoneless + SSR/hydration (linha 2.x) | ✅ 2.0.0 |

## Instalação

```bash
# Angular 21/22 (linha 2.x)
npm install --save-exact pivot-grid@2.1.1

# Angular 18/19/20 (linha 1.x)
npm install --save-exact pivot-grid@1.2.0
```

## Uso

```ts
import { Component } from '@angular/core';
import { PivotGridComponent, PivotConfig } from 'pivot-grid';

@Component({
  selector: 'app-report',
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

## Documentação

| Documento | Conteúdo |
|---|---|
| [Especificação](docs/SPECIFICATION.md) | Comportamento, regras, estados e critérios |
| [API](docs/API.md) | Tipos, inputs, outputs, métodos, tema e erros |
| [Engine](docs/ENGINE.md) | Algoritmos, complexidade e casos de borda |
| [Roadmap](docs/ROADMAP.md) | Versões, linhas 1.x/2.x e plano 2.x |
| [Integração](docs/INTEGRATION.md) | Checklist de adoção no app consumidor |
| [Migração 1.x](docs/MIGRATION.md) | Rename do pacote e remoções da 0.9.0 |
| [Migração 2.x](docs/MIGRATION-2.md) | Guia 1.x → 2.x (Angular 21+) |
| [Compatibilidade](docs/COMPATIBILITY.md) | Angular 18–22, toolchain e matriz |
| [Performance](docs/PERFORMANCE.md) | Orçamentos de 10k/50k no CI |
| [Releases](docs/RELEASES.md) | Regras, gate e passo a passo de publicação |
| [Contribuindo](docs/CONTRIBUTING.md) | Setup, testes, branches e release |
| [Exemplos](docs/examples/README.md) | Um exemplo por funcionalidade |
| [Changelog](CHANGELOG.md) | Histórico de versões |

## Demo

- Básico: <https://leonardohessel.github.io/pivot-grid/>
- Sticky + teclado: <https://leonardohessel.github.io/pivot-grid/sticky-keyboard>
- Multi-medida: <https://leonardohessel.github.io/pivot-grid/multi-medida>
- Virtualização: <https://leonardohessel.github.io/pivot-grid/virtualizacao>
- Filtros + datas: <https://leonardohessel.github.io/pivot-grid/filtros>
- Templates: <https://leonardohessel.github.io/pivot-grid/templates>
- Colunas: <https://leonardohessel.github.io/pivot-grid/colunas>

## Compatibilidade

| Linha | Angular | Peer |
|---|---|---|
| 2.x | 21, 22 | `>=21 <23` |
| 1.x | 18, 19, 20 | `>=18 <21` |

Detalhes e matriz de CI em [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

## Desenvolvimento

```bash
npm ci
npm run build:lib      # compila a biblioteca
npm run start:demo     # demo em http://localhost:4300
npm test               # testes
npm run bench          # orçamentos 10k/50k
npm run verify:package # valida o pacote antes do publish
```

## Distribuição

- Publicação **somente no npm**, com versão pinada; sem URL de git.
- Release por tag `vX.Y.Z` (workflow `publish.yml`), com
  `publishConfig.access = public`, provenance e verificação de `dist-tag`.
- `latest` = 2.1.0; `next` = RC/próxima linha.
- Licença MIT (`LICENSE` na raiz e no pacote).

## Licença

MIT © Leonardo Hessel
