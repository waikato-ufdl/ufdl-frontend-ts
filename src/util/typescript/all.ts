/**
 * Tests if a predicate is true for all values.
 *
 * @param predicate
 *          The predicate to test.
 * @param values
 *          The values to test the predicate on.
 * @return
 *          true if all values matches the predicate, false if any don't.
 */
export function all<T>(
    predicate: (value: T) => boolean,
    ...values: T[]
): boolean {
    // Test the predicate against each value, returning as soon as one doesn't match
    for (const value of values) {
        if (!predicate(value)) return false;
    }

    // All values matched the predicate
    return true;
}
