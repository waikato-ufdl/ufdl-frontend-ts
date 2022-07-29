/**
 * Generates an N-tuple of a given type.
 *
 * Taken from https://stackoverflow.com/a/52490977
 */
export type TupleMultiply<T extends readonly unknown[], N extends number>
    = N extends N
    ? number extends N
        ? T[]
        : _TupleOf<T, N, []>
    : never;

type _TupleOf<T, N extends number, R extends unknown[]>
    = R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>;
