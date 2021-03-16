/**
 * Type-predicate which checks if a given value is a Promise.
 *
 * @param value
 *          The value to check.
 * @return
 *          Whether the value is a Promise.
 */
export default function isPromise(
    value: any
): value is Promise<any> {
    return value instanceof Promise;
}
