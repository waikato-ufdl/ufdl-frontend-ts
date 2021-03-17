import {Not} from "./Not";

/**
 * The logical exclusive-or type of A and B.
 */
export type Xor<A extends boolean, B extends boolean>
    = boolean extends A
    ? boolean
    : A extends true
        ? Not<B>
        : B
