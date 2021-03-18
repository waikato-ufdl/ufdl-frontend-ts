/**
 * Checks if the given index is in-bounds for accessing the given array.
 *
 * @param array
 *          The array being accessed.
 * @param index
 *          The index to access the array at.
 * @return
 *          true if the index is valid, false if not.
 */
export function indexInBounds(array: readonly any[], index: number): boolean {
    return 0 <= index && index < array.length;
}
