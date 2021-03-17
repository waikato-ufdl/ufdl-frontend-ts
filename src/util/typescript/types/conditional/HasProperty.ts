/**
 * Whether the object type T has the given properties P.
 */
export type HasProperties<T extends {}, P extends PropertyKey>
    = P extends keyof T
    ? true
    : false
