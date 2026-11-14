/** Internal helpers shared by the pivot engine. */

export function getPath(record: Record<string, unknown>, field: string): unknown {
  if (!field.includes('.')) {
    return record[field];
  }
  let current: unknown = record;
  for (const segment of field.split('.')) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Stable key used to group values. Dates are normalized to ISO day. */
export function toKey(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }
  return String(value);
}

/** Coerces a raw value into a finite number, or null when not numeric. */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const collators = new Map<string, Intl.Collator>();

export function collator(locale: string): Intl.Collator {
  let instance = collators.get(locale);
  if (!instance) {
    instance = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    collators.set(locale, instance);
  }
  return instance;
}

export function compareCaptions(a: string, b: string, locale: string): number {
  return collator(locale).compare(a, b);
}

const formatters = new Map<string, Intl.NumberFormat>();

export function numberFormatter(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let instance = formatters.get(key);
  if (!instance) {
    instance = new Intl.NumberFormat(locale, options);
    formatters.set(key, instance);
  }
  return instance;
}

export function defaultLocale(): string {
  return typeof navigator !== 'undefined' && navigator.language
    ? navigator.language
    : 'en-US';
}
