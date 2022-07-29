/**
 * The type of elements in an array.
 */
export type ElementType<A extends readonly unknown[]> = A[number]
