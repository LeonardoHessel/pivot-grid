# pivot-grid

Angular pivot grid component: multi-level rows, dynamic columns, aggregation,
totals and export.

- Standalone Angular component (`<pg-pivot-grid>`) with `strictTemplates` support
- Framework-agnostic aggregation engine as a secondary entry point (`@leonardohessel/pivot-grid/core`)
- No runtime dependencies besides Angular and `tslib`
- MIT licensed

## Status

Early development. The workspace is scaffolded with the library and a demo application.

## Workspace

```
projects/
  pivot-grid/   # library (ng-packagr, Ivy partial compilation)
  demo/         # demo application
```

## Development

```bash
npm install

# build the library
npm run build:lib

# serve the demo (http://localhost:4300)
npm run start:demo
```

## Versioning

- v1: Angular `>=18 <21`
- v2 (planned): Angular `>=21`, using the latest APIs

## License

MIT
