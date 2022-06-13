/**
 * Maps each owned property of an object into an array
 *
 * @param obj
 *          The object to map.
 * @param body
 *          The mapping function to call for each property.
 * @return
 *          The array of mapped values.
 */
export function mapOwnProperties<T extends object, R>(
    obj: T,
    body: (property: keyof T, value: T[keyof T]) => R
): R[] {
    const result: R[] = []

    forEachOwnProperty(
        obj,
        (property, value) => {
            result.push(
                body(
                    property,
                    value
                )
            )
        }
    )

    return result
}

/**
 * Iterates over the owned properties of an object.
 *
 * @param obj
 *          The object to iterate.
 * @param body
 *          The function to call for each property.
 */
export function forEachOwnProperty<T extends object>(
    obj: T,
    body: (property: keyof T, value: T[keyof T]) => void
): void {
    for (const property of ownPropertyIterator(obj)) body(...property)
}

/**
 * Returns an iterator over the owned properties of an object.
 *
 * @param obj
 *          The object to iterate.
 * @return
 *          An iterator over the owned properties of [obj].
 */
export function* ownPropertyIterator<T extends object>(
    obj: T
): Generator<readonly [keyof T, T[keyof T]], void> {
    for (const property in obj) {
        if (!obj.hasOwnProperty(property)) continue;
        yield [property, obj[property]] as const
    }
}

/**
 * Creates a deep-copy of an object.
 *
 * @param obj
 *          The object to copy.
 */
export function deepCopyOwnProperties<T extends object>(
    obj: T
): T {
    const result: Partial<T> = {}

    forEachOwnProperty(
        obj,
        (property, value) => {
            if (typeof value === "object") {
                const copy = deepCopyOwnProperties(value as unknown as object)
                result[property] = copy as unknown as T[keyof T]
            } else {
                result[property] = value
            }
        }
    )

    return result as T
}
