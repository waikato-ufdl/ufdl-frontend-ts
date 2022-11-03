import iteratorConcat from "../iterate/concat";
import iterate from "../iterate/iterate";

export default function arrayFlatten<T>(
    array: readonly (readonly T[])[]
): T[] {
    return [
        ...iteratorConcat(
            ...array.map(iterate)
        )
    ]
}
