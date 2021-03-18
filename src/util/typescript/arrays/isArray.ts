/**
 * Checks if the given value is an array.
 *
 * @param value
 *          The value to check.
 */
export function isArray(value: any): value is readonly any[] {
    return value instanceof Array;
}
