import {RemoveReadonly} from "../types/RemoveReadonly";
import {IndexType} from "../types/array/IndexType";

export default function arrayMap<
    TArray extends readonly unknown[],
    TReturn
>(
    array: TArray,
    mapFn: (element: TArray[number], index: IndexType<TArray>) => TReturn
): RemoveReadonly<{ [TKey in keyof TArray]: TReturn }> {
    return array.map(mapFn as any) as any
}
