import {IsNumeric} from "./numeric/IsNumeric";
import {If} from "./conditional/If";

/**
 * Generates an N-tuple of a given type.
 *
 * Taken from https://stackoverflow.com/a/52490977
 */
export type NTuple<T, N extends number>
    = N extends N
    ? number extends N
        ? T[]
        : _TupleOf<T, N, []>
    : never;

/** Conditional type which resolves to never if T is not a tuple type. */
export type IsTuple<T> = T extends readonly unknown[] ? number extends T['length'] ? never : T : never

/** A tuple type that is the last N types of the given tuple type. */
export type LastN<T extends readonly unknown[], N extends number>
    = IsTuple<T> extends never
    ? never
    : IsNumeric<N> extends never
        ? never
        : _RemoveFirstUntil<T, N>

/** The union of the types of the elements of a tuple type. */
export type TupleAsUnion<T> = IsTuple<T>[number]

/** A tuple type where each element is of the same type as its index. */
export type RangeTuple<N extends number>
    = If<IsNumeric<N>, _RangeTupleBuilder<N, []>>

type _TupleOf<T, N extends number, R extends unknown[]>
    = R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>;

type _RemoveFirstUntil<T extends readonly unknown[], N extends number>
    = T['length'] extends N
    ? T
    : T extends [unknown, ...infer Tail]
        ? _RemoveFirstUntil<Tail, N>
        : never

type _RangeTupleBuilder<N extends number, A extends readonly number[]>
    = A['length'] extends N ?
    A :
    _RangeTupleBuilder<N, [...A, A['length']]>

