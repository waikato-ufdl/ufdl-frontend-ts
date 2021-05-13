/**
 * Iterates over the owned properties of an object.
 *
 * @param obj
 *          The object to iterate.
 * @param body
 *          The function to call for each property.
 */
export function forEachOwnProperty<T extends {}>(
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
export function* ownPropertyIterator<T extends {}>(
    obj: T
): Generator<readonly [keyof T, T[keyof T]], void> {
    for (const property in obj) {
        if (!obj.hasOwnProperty(property)) continue;
        yield [property, obj[property]] as const
    }
}
