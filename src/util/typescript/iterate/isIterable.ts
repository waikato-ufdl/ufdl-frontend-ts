/**
 * Checks if a value is iterable.
 *
 * @param value
 *          The value to check.
 * @return
 *          Whether the value is iterable.
 */
export default function isIterable(
    value: any
): value is Iterable<any> {
    return Symbol.iterator in value;
}
