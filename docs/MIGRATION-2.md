# Migração 1.x → 2.x (Angular 21+)

> **Status:** **2.1.0 estável** (`latest`), com a 2.0.0 validada pelo consumidor
> no Angular 22. A 1.2.0 permanece disponível para Angular 18–20.

## O que muda

| Item | 1.x | 2.x |
|---|---|---|
| Angular | `>=18 <21` | **`>=21 <23`** |
| Zoneless | opcional | **padrão** |
| SSR/hydration | não suportado oficialmente | **suportado** |
| API pública | congelada na 1.0 | **sem mudanças** |

Não há feature nova na 2.0: linhas, colunas, agregadores, múltiplos valores,
totais, filtros, hierarquia de datas, templates, virtualização e exports CSV/XLSX
têm a mesma API e comportamento da 1.2.0.

## Instalação do RC

```bash
npm install --save-exact pivot-grid@2.1.0
```

O `latest` aponta para a 2.1.0; a 1.x segue publicada e suportada para Angular 18–20.

## Zoneless

A demo 2.x usa `provideZonelessChangeDetection()` e não inclui `zone.js` no
bundle da aplicação. O componente não depende de `NgZone`.

Para migrar um app existente:

```diff
- bootstrapApplication(AppComponent, {
-   providers: [provideZoneChangeDetection({ eventCoalescing: true })],
- });
+ bootstrapApplication(AppComponent, {
+   providers: [provideZonelessChangeDetection()],
+ });
```

Remova `zone.js` dos polyfills da aplicação.

## SSR/hydration

A demo 2.x tem `@angular/ssr` configurado (`outputMode: server`), com
`provideClientHydration(withEventReplay())` e prerender das rotas estáticas.

- o componente não acessa `window`/`document` na construção;
- medições de viewport usam `ResizeObserver` apenas no browser;
- SSR/hydration não exige mudanças de API no consumidor.

## Passos de upgrade

1. atualizar o app para **Angular 21** (ou 22);
2. instalar `pivot-grid@next` com versão exata;
3. remover `zone.js` e usar `provideZonelessChangeDetection`;
4. se usar SSR, configurar `@angular/ssr` + `provideClientHydration`;
5. validar matriz, totais, regras, filtros, templates, virtualização e XLSX;
6. reportar o resultado para o release estável 2.0.0.

## Validação do estável

- consumidor validado no **Angular 22**;
- `latest` promovido para 2.0.0 e, na sequência, 2.1.0;
- a 1.x continua publicada e suportada para Angular 18–20.


