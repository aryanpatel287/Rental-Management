/**
 * Formats a number to currency standard decimal places
 * @param {number} val 
 * @returns {number}
 */
export function formatDecimal(val) {
    return Number(Number(val).toFixed(2));
}
