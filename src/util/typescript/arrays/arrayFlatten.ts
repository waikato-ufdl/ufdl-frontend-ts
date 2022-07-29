import arrayMap from "./arrayMap";
import iteratorConcat from "../iterate/concat";
import iterate from "../iterate/iterate";

export default function arrayFlatten<T>(
    array: readonly (readonly T[])[]
): T[] {
    return [
        ...iteratorConcat(
            ...arrayMap<readonly (readonly T[])[], Iterator<T>>(array, iterate)
        )
    ]
}
