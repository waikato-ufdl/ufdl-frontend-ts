import {If} from "../conditional/If";
import {IsNumeric} from "../numeric/IsNumeric";
import {ElementType} from "./ElementType";
import {IsTuple} from "./IsTuple";
import {NTuple} from "./NTuple";

/**
 * A tuple type that is the last N types of the given tuple type.
 */
export type LastN<T extends readonly unknown[], N extends number>
    = If<
        IsNumeric<N>,
        If<
            IsTuple<T>,
            _RemoveFirstUntil<T, N>,
            NTuple<ElementType<T>, N>
        >,
        never
    >

type _RemoveFirstUntil<T extends readonly unknown[], N extends number>
    = T['length'] extends N
    ? T
    : T extends [unknown, ...infer Tail]
        ? _RemoveFirstUntil<Tail, N>
        : never