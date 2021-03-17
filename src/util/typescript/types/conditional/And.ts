/**
 * The logical and type of A and B.
 */
export type And<A extends boolean, B extends boolean>
    = boolean extends A
    ? B extends false
        ? false
        : boolean
    : A extends false
        ? false
        : B
