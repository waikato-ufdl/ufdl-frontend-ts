/** The type of an array of T with at least a first element. */
export type AtLeastOne<T> = [T, ...T[]]
