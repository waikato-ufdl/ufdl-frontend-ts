import useDerivedStates from "./useDerivedStates";
import {mapOwnProperties} from "../../typescript/object";
import arrayFlatten from "../../typescript/arrays/arrayFlatten";
import {anyToString} from "../../typescript/strings/anyToString";
import {tuple, tupleMap} from "../../typescript/arrays/tuple";

export default function useCachedObject<T extends object>(
    obj: T
): T {
    return useCachedObjects(obj)[0]
}

function createPropertyValuePair<T extends object>(
): <K extends keyof T>(prop: K, val: T[K]) => [K, T[K]] {
    return tuple
}

function getCanonicalPropertyAndValuePairArray<T extends object>(
    obj: T
): [keyof T, T[keyof T]][] {
    const pairArray = mapOwnProperties<T, [keyof T, T[keyof T]]>(
        obj,
        createPropertyValuePair<T>()
    )

    pairArray.sort(
        ([prop1], [prop2]) => anyToString(prop1).localeCompare(anyToString(prop2))
    )

    return pairArray
}

function interleavePropertiesAndValue<T extends object>(
    obj: T
): (keyof T | T[keyof T])[] {
    return arrayFlatten(
        getCanonicalPropertyAndValuePairArray(
            obj
        )
    )
}

export function useCachedObjects<A extends readonly object[]>(
    ...objects: A
): A {

    // Create a canonical array (sorted by property name) of interleaved properties/values for each object,
    // ensuring the array of these arrays is in the same order as the given objects.
    const objectPropertyValuePairs = tupleMap<A, { [I in keyof A]: (keyof A[I] | A[I][keyof A[I]])[] }>(
        objects,
        interleavePropertiesAndValue
    )

    // Use the canonical arrays to derive copy objects, reusing previous instances when
    // the properties haven't changed
    const map = useDerivedStates(
        objectFromFlatPropertyArray,
        objectPropertyValuePairs
    )

    // Return the cached objects in the same order as the originals were given
    return tupleMap(
        objectPropertyValuePairs,
        el => map.get(el as any)!
    )
}

function objectFromFlatPropertyArray<T extends object>(
    ...flatPropArray: readonly (keyof T | T[keyof T])[]
): T {
    const result = {} as Partial<T>

    for (let i = 0; i < flatPropArray.length; i += 2) {
        result[flatPropArray[i] as keyof T] = flatPropArray[i + 1] as T[keyof T]
    }

    return result as T
}