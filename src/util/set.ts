/**
 * Returns those elements in set 'a' which are not in set 'b'.
 *
 * @param a
 *          Set 'a'.
 * @param b
 *          Set 'b'.
 * @return
 *          The difference of set 'a' from set 'b'.
 */
export function setDifference<T>(
    a: ReadonlySet<T>,
    b: ReadonlySet<T>
): Set<T> {
    const result = new Set<T>();

    for (const element of a) {
        if (!b.has(element)) result.add(element)
    }

    return result
}

/**
 * Checks if two or more sets are all equal to each other.
 *
 * @param a
 *          The first set.
 * @param b
 *          The second set.
 * @param sets
 *          Any additional sets.
 * @return
 *          True if all given sets are equal (contain the same elements). False if not.
 */
export function setsEqual<T>(
    a: ReadonlySet<T>,
    b: ReadonlySet<T>,
    ...sets: ReadonlySet<T>[]
): boolean {
    for (const set of [b, ...sets]) {
        if (set.size !== a.size) return false
        for (const element of a) {
            if (!set.has(element)) return false
        }
    }

    return true

}