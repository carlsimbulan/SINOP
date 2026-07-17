/**
 * Utility functions for ID number masking and expiry checking.
 *
 * maskIdNumber — Property 6: ID number masking always shows exactly the last 4 characters
 * isExpired    — Property 7: Expiry check is consistent with date ordering
 */

/**
 * Mask an ID number so only the last 4 characters are visible.
 * Strings of length ≤ 4 are returned unchanged.
 *
 * @param {string} idNumber
 * @returns {string}
 *
 * @example
 * maskIdNumber("123456789") // "•••••6789"
 * maskIdNumber("1234")      // "1234"
 * maskIdNumber("")          // ""
 */
export function maskIdNumber(idNumber) {
  if (idNumber.length <= 4) return idNumber;
  return '•'.repeat(idNumber.length - 4) + idNumber.slice(-4);
}

/**
 * Returns true if the given ISO date string is strictly before today
 * (device local date, compared at midnight).
 *
 * @param {string} isoDate  "YYYY-MM-DD"
 * @returns {boolean}
 */
export function isExpired(isoDate) {
  if (!isoDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(isoDate + 'T00:00:00');
  return expiry < today;
}
