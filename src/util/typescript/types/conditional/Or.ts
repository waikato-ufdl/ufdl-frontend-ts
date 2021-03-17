/**
 * The logical or type of A and B.
 */
export type Or<A extends boolean, B extends boolean>
    = boolean extends A
    ? B extends true
        ? true
        : boolean
    : A extends true
        ? true
        : B
