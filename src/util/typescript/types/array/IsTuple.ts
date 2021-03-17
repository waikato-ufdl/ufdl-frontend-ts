/**
 * Conditional type which checks if the type of T is a tuple.
 */
export type IsTuple<T>
    = T extends readonly unknown[]
    ? number extends T['length']
        ? false
        : true
    : false
