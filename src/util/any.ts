export function any<T>(
    predicate: (value: T) => boolean,
    ...values: T[]
): boolean {
    for (const value of values) {
        if (predicate(value)) return true;
    }
    return false;
}
