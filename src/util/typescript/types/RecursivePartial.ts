/**
 * Sets all keys of T to optional, and recursively repeats for
 * all properties with object-typed values.
 */
export type RecursivePartial<T extends object> = {
    [K in keyof T]?: (T[K] extends object ? RecursivePartial<T[K]> : T[K])
}
