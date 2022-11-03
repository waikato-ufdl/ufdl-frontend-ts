import {If} from "../conditional/If";
import {IsTuple} from "./IsTuple";

/**
 * Because TypeScript thinks that the indices of an array are
 * strings, we build a type that maps those string indices to
 * numeric indices.
 */
export type IndexKeysOf<A extends readonly unknown[]>
    = If<
        IsTuple<A>,
        Exclude<Partial<A>["length"], A["length"]> & keyof A,
        number
    >
