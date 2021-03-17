import {If} from "../conditional/If";
import {IsTuple} from "./IsTuple";
import {DefiniteIndexType} from "./DefiniteIndexType";

/**
 * Gets the type of the valid indices to an array type.
 */
export type IndexType<A extends readonly any[]>
    = If<
    IsTuple<A>,
    DefiniteIndexType<A>,
    number
>
