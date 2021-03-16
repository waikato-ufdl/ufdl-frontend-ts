/**
 * Sets all keys of T to readonly, and recursively repeats for
 * all properties with object-typed values.
 */
export type RecursiveReadonly<T> = {
    readonly [K in keyof T]: (T[K] extends object ? RecursiveReadonly<T[K]> : T[K])
}
