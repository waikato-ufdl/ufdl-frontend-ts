/**
 * The logical inverse type of C.
 */
export type Not<C extends boolean>
    = boolean extends C
    ? boolean
    : C extends true
        ? false
        : true
