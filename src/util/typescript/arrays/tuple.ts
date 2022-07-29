import {NTuple} from "../types/array/NTuple";
import range from "../range";

export function tupleMap<
    T extends readonly unknown[],
    R extends { [K in keyof T]: any }
>(
    tuple: T,
    mapFunctions: { readonly [K in keyof T]: (value: T[K], index: K) => R[K] }
): R {
    return tuple.map(
        (value, index) => {
            return mapFunctions[index](value, index)
        }
    ) as any
}

export function nTupleOf<T, N extends number>(
    value: T,
    num: N
): NTuple<T, N> {
    if (num < 0) throw new Error(`num cannot be less than 0; got ${num}`)
    const result = []
    for (const _ of range(num)) {
        result.push(value)
    }
    return result as any;
}

export function tupleAppend<
    T extends readonly unknown[],
    V extends readonly unknown[]
>(
    tuple: T,
    value: V
): [...T, ...V] {
    return [...tuple, ...value]
}

export function tuple<T extends readonly unknown[]>(
    ...vals: T
): T {
    return vals
}
