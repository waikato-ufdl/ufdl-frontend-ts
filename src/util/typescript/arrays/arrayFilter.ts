import {ElementType} from "../types/array/ElementType";
import {IndexType} from "../types/array/IndexType";

export default function arrayFilter<
    TArray extends readonly unknown[],
    TFilterFn extends (element: ElementType<TArray>, index: IndexType<TArray>) => boolean
>(
    array: TArray,
    filterFn: TFilterFn
): ElementType<TArray>[] {
    return array.filter(filterFn as any)
}
