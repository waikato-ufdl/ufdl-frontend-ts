/**
 * Checks if an array is empty or not.
 *
 * @param array
 *          The array to check.
 * @return
 *          `true` if the array has at least one element.
 */
export function isNotEmpty<T>(
    array: readonly T[]
): array is [T, ...T[]] {
    return array.length > 0
}
