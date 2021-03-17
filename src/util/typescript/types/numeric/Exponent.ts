import {If} from "../conditional/If";
import {IsNumeric} from "./IsNumeric";
import {Subtract} from "./Subtract";

/**
 * Returns the type of 2^N for a numeric type N.
 *
 * Slow.
 */
export type Exponent<N extends number>
    = If<
        IsNumeric<N>,
        _ExponentHelper<N, [any]>,
        never
    >

type _ExponentHelper<N extends number, B extends any[]>
    = N extends 0
        ? B
        : _ExponentHelper<Subtract<N, 1>, [...B, ...B]>
