// Infers the iterated type of an iterable or iterator
export type IteratedType<T extends Iterator<unknown> | Iterable<unknown>>
    = T extends Iterator<infer I> | Iterable<infer I>
        ? I
        : never
