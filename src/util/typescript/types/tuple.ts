/**
 * Generates an N-tuple of a given type.
 *
 * Taken from https://stackoverflow.com/a/52490977
 */
import {IsNumeric} from "./numeric/IsNumeric";

export type NTuple<T, N extends number>
    = N extends N
    ? number extends N
        ? T[]
        : _TupleOf<T, N, []>
    : never;

type _TupleOf<T, N extends number, R extends unknown[]>
    = R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>;

export type IsTuple<T> = T extends readonly unknown[] ? number extends T['length'] ? never : T : never

export type LastN<T extends readonly unknown[], N extends number>
    = IsTuple<T> extends never
    ? never
    : IsNumeric<N> extends never
        ? never
        : _RemoveFirstUntil<T, N>

type _RemoveFirstUntil<T extends readonly unknown[], N extends number>
    = T['length'] extends N
    ? T
    : T extends [unknown, ...infer Tail]
        ? _RemoveFirstUntil<Tail, N>
        : never

export type TupleAsUnion<T> = IsTuple<T>[number]
