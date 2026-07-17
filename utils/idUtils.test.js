/**
 * Tests for utils/idUtils.js
 *
 * Unit tests cover specific examples and edge cases.
 * Property-based tests verify universal invariants across all inputs.
 */

import fc from 'fast-check';
import { maskIdNumber, isExpired } from './idUtils.js';

// ---------------------------------------------------------------------------
// maskIdNumber — unit tests
// ---------------------------------------------------------------------------

describe('maskIdNumber — unit tests', () => {
  test('empty string returns empty string', () => {
    expect(maskIdNumber('')).toBe('');
  });

  test('string of length 1 is returned unchanged', () => {
    expect(maskIdNumber('A')).toBe('A');
  });

  test('string of length 4 is returned unchanged', () => {
    expect(maskIdNumber('1234')).toBe('1234');
  });

  test('string of length 5 masks first character only', () => {
    expect(maskIdNumber('12345')).toBe('•2345');
  });

  test('standard 9-digit ID is masked correctly', () => {
    expect(maskIdNumber('123456789')).toBe('•••••6789');
  });

  test('longer ID is masked correctly', () => {
    expect(maskIdNumber('ABCDEFGHIJ')).toBe('••••••GHIJ');
  });
});

// ---------------------------------------------------------------------------
// maskIdNumber — Property 6: ID number masking always shows exactly the last 4
// ---------------------------------------------------------------------------
// Feature: sinop-vault, Property 6: ID number masking always shows exactly the last 4 characters
// Validates: Requirements 2.4

describe('maskIdNumber — Property 6', () => {
  test('for length >= 5: length preserved, last 4 unchanged, prefix is all bullets', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 30 }),
        (id) => {
          const result = maskIdNumber(id);
          const prefixLen = id.length - 4;
          return (
            result.length === id.length &&
            result.slice(-4) === id.slice(-4) &&
            [...result.slice(0, prefixLen)].every((c) => c === '•')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('for length <= 4: no masking applied (result === input)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 4 }),
        (id) => maskIdNumber(id) === id
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// isExpired — unit tests
// ---------------------------------------------------------------------------

describe('isExpired — unit tests', () => {
  test('null returns false (graceful handling)', () => {
    expect(isExpired(null)).toBe(false);
  });

  test('undefined returns false (graceful handling)', () => {
    expect(isExpired(undefined)).toBe(false);
  });

  test('empty string returns false (graceful handling)', () => {
    expect(isExpired('')).toBe(false);
  });

  test('a date far in the past is expired', () => {
    expect(isExpired('2000-01-01')).toBe(true);
  });

  test('yesterday is expired', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = yesterday.toISOString().slice(0, 10);
    expect(isExpired(iso)).toBe(true);
  });

  test('today is NOT expired', () => {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    expect(isExpired(iso)).toBe(false);
  });

  test('tomorrow is NOT expired', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);
    expect(isExpired(iso)).toBe(false);
  });

  test('a date far in the future is not expired', () => {
    expect(isExpired('2099-12-31')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isExpired — Property 7: Expiry check is consistent with date ordering
// ---------------------------------------------------------------------------
// Feature: sinop-vault, Property 7: Expiry check is consistent with date ordering
// Validates: Requirements 2.5

describe('isExpired — Property 7', () => {
  /**
   * Helper: format a Date as "YYYY-MM-DD".
   * Using local date parts to stay consistent with how isExpired parses.
   */
  function toLocalIso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  test('a date strictly before today always returns true', () => {
    // Generate a number of days in the past (1..3650)
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3650 }),
        (daysAgo) => {
          const past = new Date();
          past.setDate(past.getDate() - daysAgo);
          return isExpired(toLocalIso(past)) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('a date today or in the future always returns false', () => {
    // 0 = today, positive = future
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3650 }),
        (daysAhead) => {
          const future = new Date();
          future.setDate(future.getDate() + daysAhead);
          return isExpired(toLocalIso(future)) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('isExpired is deterministic — same input returns same result on repeated calls', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3650, max: 3650 }),
        (offset) => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          const iso = toLocalIso(d);
          return isExpired(iso) === isExpired(iso);
        }
      ),
      { numRuns: 100 }
    );
  });
});
