import {If} from "../conditional/If";
import {And} from "../conditional/And";
import {IsNumeric} from "./IsNumeric";
import {NTuple} from "../tuple";

export type Multiply<N1 extends number, N2 extends number>
    = If<
    And<
        IsNumeric<N1>,
        IsNumeric<N2>
        >,
    _MultiplyHelper<NTuple<any, N1>, NTuple<any, N2>, []>
    >

type _MultiplyHelper<A1 extends readonly unknown[], A2 extends readonly unknown[], R extends readonly unknown[]>
    = A2 extends [any, ...infer T] ?
    _MultiplyHelper<A1, T, [...A1, ...R]> :
    R['length']
