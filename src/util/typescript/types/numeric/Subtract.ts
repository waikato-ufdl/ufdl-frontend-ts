import {If} from "../conditional/If";
import {And} from "../conditional/And";
import {IsNumeric} from "./IsNumeric";
import {NTuple} from "../array/NTuple";

/**
 * Returns the difference between two numeric types.
 */
export type Subtract<N1 extends number, N2 extends number>
    = If<
        And<IsNumeric<N1>, IsNumeric<N2>>,
        _SubtractHelper<NTuple<any, N1>, NTuple<any, N2>>,
        number
    >

type _SubtractHelper<A1 extends readonly unknown[], A2 extends readonly unknown[]>
    = A1 extends readonly [...A2, ...infer R]
        ? R['length']
        : never
