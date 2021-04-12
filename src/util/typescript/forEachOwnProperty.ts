/**
 * Iterates over the owned properties of an object.
 *
 * @param obj
 *          The object to iterate.
 * @param body
 *          The function to call for each property.
 */
export default function forEachOwnProperty<T extends {}>(
    obj: T,
    body: (property: keyof T, value: T[keyof T]) => void
): void {
    for (const property in obj) {
        if (!obj.hasOwnProperty(property)) continue;
        body(property, obj[property]);
    }
}
