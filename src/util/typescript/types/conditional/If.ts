/**
 * Evaluates to A if C is true, B if false, and A | B if undecided.
 */
export type If<C extends boolean, A = true, B = false>
    = boolean extends C
    ? A | B
    : C extends true
        ? A
        : B
