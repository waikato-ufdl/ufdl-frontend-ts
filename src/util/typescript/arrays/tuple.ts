import {NTuple} from "../types/array/NTuple";
import range from "../range";

/**
 * Similar to {@link Array.map}, but preserves tuple length information,
 * and can individually map heterogeneous element types. The type-signature
 * is a bit gnarly compared with {@link Array.map}, so only use if the
 * length/heterogeneous functionality is required.
 *
 * @param tuple
 *          The source tuple to map over.
 * @param mapFn
 *          The function which maps each element to it's correspondent in the result.
 * @return
 *          The mapped result.
 */
export function tupleMap<
    TTuple extends readonly unknown[],
    TResult extends { -readonly [TKey in keyof TTuple]: unknown }
    >(
    tuple: TTuple,
    mapFn: <TIndex extends keyof TTuple & number>(element: TTuple[TIndex], index: TIndex, tuple: TTuple) => TResult[TIndex]
): TResult {
    return tuple.map(mapFn as any) as any
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
