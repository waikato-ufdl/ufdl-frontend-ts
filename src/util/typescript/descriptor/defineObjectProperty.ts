export function defineObjectProperty<T extends object, P extends keyof T>(
    o: T,
    p: P,
    attributes: TypedPropertyDescriptor<T[P]>
): T {
    return Object.defineProperty(o, p, attributes);
}