export type Defined<T>
    = Exclude<T, undefined>

/**
 * Checks if a value is defined.
 *
 * @param value
 *          The value to check.
 * @return
 *          Whether the value is defined.
 */
export default function isDefined<T>(
    value: T | undefined
): value is Defined<T> {
    return value !== undefined
}
