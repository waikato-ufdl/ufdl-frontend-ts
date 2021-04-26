/**
 * Gets the value of a property from a target, asserting
 * its type.
 *
 * @param target
 *          The target.
 * @param property
 *          The property to get.
 * @return
 *          The value of the property.
 */
export default function getPropertyUnchecked<T>(
    target: {},
    property: string
) : T {
    return (target as any)[property] as T;
}
