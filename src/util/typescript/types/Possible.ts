/**
 * Symbol representing the absence of a value.
 */
export const Absent = Symbol("Absent");

/**
 * The type representing either a value of type T, or no value whatsoever.
 */
export type Possible<T> = T | typeof Absent

export type Present<T> = Omit<T, typeof Absent>

/**
 * Type-narrowing check if a value is present.
 *
 * @param value
 *          The value to check.
 */
export function isPresent<T>(
    value: Possible<T>
): value is T {
    return value !== Absent;
}

export function ifPresent<T, R>(
    value: Possible<T>,
    ifPresent: (value: Present<T>) => R,
    ifAbsent: () => R
): R {
    if (isPresent(value))
        return ifPresent(value)
    else
        return ifAbsent()
}

/**
 * Assertion that that given value is definitely present.
 *
 * @param value
 *          The value that is the subject of the assertion.
 */
export function assertPresent<T>(
    value: Possible<T>
): asserts value is T {
    if (!isPresent(value))
        throw new Error("Value is not present");
}

/**
 * Converts a possible value to its definite equivalent.
 *
 * @param value
 *          The value to convert.
 */
export function asAssertedPresent<T>(
    value: Possible<T>
): T {
    assertPresent(value);
    return value;
}

/**
 * Treats the value undefined as absent.
 *
 * @param value
 *          The value to convert.
 */
export function undefinedAsAbsent<T>(
    value: T | undefined
): Possible<T> {
    if (value === undefined)
        return Absent;
    else
        return value;
}

/**
 * Treats the absence of a value as the undefined value.
 *
 * @param value
 *          The value to convert.
 */
export function absentAsUndefined<T>(
    value: Possible<T>
): T | undefined {
    if (isPresent(value))
        return value;
    else
        return undefined;
}
