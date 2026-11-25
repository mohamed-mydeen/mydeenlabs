import { describe, it, expect } from 'vitest';
import { formatDuration, formatNumber, maskVisitorId } from '../formatters';

describe('formatters', () => {
  it('formats durations cleanly', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(-5)).toBe('0s');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats numbers with locale separators', () => {
    expect(formatNumber(1234)).toBe('1,234');
    expect(formatNumber(NaN)).toBe('0');
  });

  it('masks long visitor IDs', () => {
    expect(maskVisitorId('')).toBe('anon-unknown');
    expect(maskVisitorId('short')).toBe('short');
    expect(maskVisitorId('visitor_1234567890_abcd')).toBe('visito…abcd');
  });
});
