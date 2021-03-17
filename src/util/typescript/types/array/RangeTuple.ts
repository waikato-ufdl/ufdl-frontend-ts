import {If} from "../conditional/If";
import {IsNumeric} from "../numeric/IsNumeric";

/**
 * A tuple type where each element is of the same type as its index.
 */
export type RangeTuple<N extends number>
    = If<IsNumeric<N>, _RangeTupleBuilder<N, []>>

type _RangeTupleBuilder<N extends number, A extends readonly number[]>
    = A['length'] extends N
    ? A
    : _RangeTupleBuilder<N, [...A, A['length']]>
