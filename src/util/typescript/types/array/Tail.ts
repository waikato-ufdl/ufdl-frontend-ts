/** The type of all elements of the array-type except the first. */
export type Tail<Tuple extends readonly unknown[]>
    = Tuple extends [any, ...infer Tail]
    ? Tail
    : Tuple['length'] extends 0
        ? never
        : Tuple
