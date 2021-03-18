/**
 * Tests if a predicate is true for any value.
 *
 * @param predicate
 *          The predicate to test.
 * @param values
 *          The values to test the predicate on.
 * @return
 *          true if any value matches the predicate, false if none do.
 */
export function any<T>(
    predicate: (value: T) => boolean,
    ...values: T[]
): boolean {
    // Test the predicate against each value, returning as soon as one matches
    for (const value of values) {
        if (predicate(value)) return true;
    }

    // No values matched the predicate
    return false;
}
