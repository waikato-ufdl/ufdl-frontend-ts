/** The type of the first element of an array-type. */
export type Head<Tuple extends readonly unknown[]>
    = Tuple['length'] extends 0
    ? never
    : Tuple[0]
