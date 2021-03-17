/**
 * The type of indices that will definitely index an array/tuple type.
 * A union of numbers for tuples/hybrid arrays, and never for plain
 * arrays.
 */
export type DefiniteIndexType<A extends readonly unknown[]>
    = Exclude<keyof A, keyof []>
