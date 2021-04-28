/** The type of the last element of an array-type. */
export type End<Tuple extends readonly unknown[]>
    = Tuple['length'] extends 0
    ? never
    : Tuple extends [...infer _, infer End]
        ? End
        : never
