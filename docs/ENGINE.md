# Engine (`pivot-grid/core`)

O engine é TypeScript puro, sem Angular, sem I/O. Recebe dados planos e uma
configuração e devolve um `PivotResult` imutável.

## 1. Pipeline

```
buildPivot(data, config)
  1. normalizeConfig()
  2. validate()
  3. groupRows()      -> árvore de linhas
  4. groupColumns()   -> árvore de colunas
  5. aggregate()      -> células folha, na granularidade (rowLeaf × colLeaf)
  6. computeTotals()  -> totais de linha, coluna e geral
  7. sortAxes()       -> ordena filhos de cada nível
  8. format()         -> valores formatados
  9. attachDiagnostics()
```

Cada etapa é uma função pura; nenhuma muta `data` nem `config`.

## 2. Normalização

- `rows`, `columns` e `values` são copiados para arrays internos.
- `caption` default = `field`.
- `aggregator` default = `'sum'`.
- `locale` default = `navigator.language` (browser) ou `'en-US'` (SSR).
- `defaultExpandDepth` default = `1`; `'all'` expande todos.
- Campos com caminho (`a.b`) são resolvidos por `getPath(record, field)`.

## 3. Agrupamento

Para cada eixo, percorre-se os registros **uma única vez** e constrói-se uma
árvore de mapas:

```
for record of data:
  node = root
  for field of axis:
    key = normalizeKey(get(record, field))
    node = node.children.get(key) ?? createNode(key, value)
  node.records.push(record)
```

- `normalizeKey` usa `String(value)` com `Date` → ISO `YYYY-MM-DD`.
- A ordem inicial dos filhos é a ordem de primeira ocorrência nos dados.
- Nós folha acumulam a lista de registros para agregação.

Complexidade: `O(N × (|rows| + |columns|))`.

## 4. Agregação

Cada célula corresponde ao cruzamento de uma folha de linha com uma folha de
coluna. O conjunto de registros da célula é a **interseção** das listas:

```
for rowLeaf of rowLeaves:
  for colLeaf of colLeaves:
    records = intersect(rowLeaf.records, colLeaf.records)
    for valueConfig of values:
      cell = aggregate(records, valueConfig)
```

- `intersect` usa o conjunto menor e verifica pertinência no maior (hash),
  evitando produto cartesiano ingênuo quando possível.
- Agregadores:

| Agregador | Implementação |
|---|---|
| `sum` | acumula `value` |
| `avg` | acumula `sum` e `count`; divide no final |
| `min`/`max` | compara e substitui |
| `count` | incrementa por valor válido |
| `countDistinct` | `Set<string>` dos valores |

- Conversão: `Number.isFinite(Number(v))`; `null`, `undefined`, `''`, `NaN`,
  `Infinity` são ignorados.
- Arredondamento **não** ocorre aqui; apenas na formatação.

Complexidade no pior caso: `O(N × |rows| × |columns|)`; no caso comum
(hierarquias balanceadas) próxima de `O(N × |columns|)`.

## 5. Totais

| Total | Conjunto |
|---|---|
| Linha | todos os registros da folha de linha (todas as colunas) |
| Coluna | todos os registros da folha de coluna |
| Geral | todos os registros de todas as folhas |

Totais são **recalculados** a partir dos registros, nunca somando células já
agregadas (evita erro de média de médias e de arredondamento).

`countDistinct` em totais usa a união dos conjuntos, não a soma das
cardinalidades.

## 6. Ordenação

```
sortAxes(nodes, sort, locale)
  for each level:
    nodes.sort(comparator)
```

- `caption`: `Intl.Collator(locale, { numeric: true, sensitivity: 'base' })`.
- `value`: compara `aggregates[sort.field]` (nulos ao final em `asc` e `desc`).
- Estabilidade: `Array.prototype.sort` é estável por especificação (ES2019);
  empates mantêm a ordem de primeira ocorrência.
- Totais são anexados após a ordenação, respeitando `totalsPosition`.

## 7. Formatação

```
formatPivotValue(value, valueConfig, locale)
  if value == null: return emptyText
  if typeof format === 'function': return format(value)
  options = typeof format === 'object' ? format : Intl options
  return new Intl.NumberFormat(locale, options).format(value)
```

- Instâncias de `Intl.NumberFormat` são cacheadas por `(locale, options)`.
- A formatação é aplicada uma vez por célula no `buildPivot`; re-render não
  reformata.

## 8. Formatação condicional

```
for cell of cells:
  for rule of rules (em ordem):
    if target/field não casam: continue
    if predicate && !predicate(cell): continue
    if comparação(rule, cell.value):
      cell.className = rule.className; cell.style = rule.style
      break   // primeira regra vence
```

- `applyToTotals` controla a aplicação em células de total.
- `predicate` com exceção gera diagnóstico `rule-error` e é ignorado.

## 9. Imutabilidade e determinismo

- `PivotResult` exposto é `Readonly` (coleções congeladas em dev).
- Nenhuma referência a `data` é retornada; apenas valores agregados.
- Ordenação de mapas é explícita (arrays ordenados), nunca por ordem de
  inserção de objeto.
- Mesma entrada + config ⇒ mesma saída.

## 10. Casos de borda

| Caso | Comportamento |
|---|---|
| `data = []` | `rowTree`/`columnTree` vazios, `grandTotal = null` |
| `rows = []` | uma única linha "total" (se habilitado) |
| `columns = []` | uma única coluna de valor |
| Valor não numérico | ignorado + diagnóstico |
| Campo ausente | chave `undefined` normalizada para `'(vazio)'`? **Não**: usa `''` e emite `missing-field` |
| Datas | convertidas para ISO; agrupam por dia |
| `NaN`/`Infinity` | ignorados |
| Valores negativos | agregados normalmente; formatação padrão |
| Strings numéricas (`"10"`) | convertidas para número |
| Duplicidade de campo em `rows` | erro de config |
| Muitos valores distintos em colunas | sem limite; ver performance |

## 11. Performance

- Uma passada por eixo para agrupar.
- Cache de `Intl.NumberFormat`.
- Nenhuma cópia de registros além das listas de folhas.
- Para 10.000 registros × 12 colunas, meta ≤ 80 ms.
- O componente calcula a matriz **visível** apenas com os nós expandidos; o
  engine sempre produz a matriz completa.

## 12. Testes do engine

- Tabela verdade por agregador (incluindo vazios e inválidos).
- Totais comparados com agregação direta dos registros.
- `avg` de subconjuntos ≠ média das médias (teste explícito).
- Ordenação estável e com locale.
- Formatação com `Intl` e com função.
- Regras condicionais (primeira vence, `applyToTotals`).
- Determinismo: executar duas vezes e comparar estruturas.
