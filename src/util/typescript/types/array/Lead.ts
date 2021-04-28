/** The type of all elements of the array-type except the last. */
export type Lead<Tuple extends readonly unknown[]>
    = Tuple['length'] extends 0
    ? never
    : Tuple extends [...infer Lead, any]
        ? Lead
        : never
