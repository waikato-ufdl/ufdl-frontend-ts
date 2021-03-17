import {If} from "../conditional/If";
import {And} from "../conditional/And";
import {IsNumeric} from "./IsNumeric";
import {NTuple} from "../array/NTuple";

/**
 * Adds two numeric types together.
 */
export type Add<N1 extends number, N2 extends number>
    = If<
        And<IsNumeric<N1>, IsNumeric<N2>>,
        [...NTuple<any, N1>, ...NTuple<any, N2>]['length'],
        number
    >
