import { Aggregator } from './types';
import { toNumber } from './util';

/**
 * Accumulator used for a set of records.
 *
 * `records` counts every record that reached the bucket (including records
 * without a valid number) so that "no rows" can be distinguished from
 * "rows but no valid value" when rendering empty cells.
 */
export interface AggState {
  records: number;
  valid: number;
  sum: number;
  min: number | null;
  max: number | null;
  distinct: Set<string> | null;
}

export function createState(aggregator: Aggregator): AggState {
  return {
    records: 0,
    valid: 0,
    sum: 0,
    min: null,
    max: null,
    distinct: aggregator === 'countDistinct' ? new Set<string>() : null,
  };
}

export function addRecord(
  state: AggState,
  aggregator: Aggregator,
  raw: unknown,
): void {
  state.records += 1;
  const value = toNumber(raw);
  if (value === null) {
    return;
  }
  state.valid += 1;
  state.sum += value;
  if (state.min === null || value < state.min) {
    state.min = value;
  }
  if (state.max === null || value > state.max) {
    state.max = value;
  }
  if (aggregator === 'countDistinct') {
    state.distinct?.add(String(value));
  }
}

export function mergeStates(target: AggState, source: AggState): AggState {
  target.records += source.records;
  target.valid += source.valid;
  target.sum += source.sum;
  if (source.min !== null && (target.min === null || source.min < target.min)) {
    target.min = source.min;
  }
  if (source.max !== null && (target.max === null || source.max > target.max)) {
    target.max = source.max;
  }
  if (target.distinct && source.distinct) {
    for (const value of source.distinct) {
      target.distinct.add(value);
    }
  }
  return target;
}

export function finalize(state: AggState, aggregator: Aggregator): number | null {
  if (state.records === 0) {
    return null;
  }
  switch (aggregator) {
    case 'sum':
      return state.sum;
    case 'avg':
      return state.valid > 0 ? state.sum / state.valid : null;
    case 'min':
      return state.min;
    case 'max':
      return state.max;
    case 'count':
      return state.valid;
    case 'countDistinct':
      return state.distinct ? state.distinct.size : 0;
    default:
      return null;
  }
}
