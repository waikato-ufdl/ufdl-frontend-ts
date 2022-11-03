import {tupleMap} from "../arrays/tuple";
import {IndexKeysOf} from "../types/array/IndexKeysOf";

/**
 * Returns a promise which awaits the first of the given values to resolve.
 *
 * @param values
 *          The array of awaitables.
 * @return
 *          A pair of the first [index, value] to resolve.
 */
export function raceEnumerated<T extends readonly unknown[]>(
    values: T
): Promise<{ [Index in IndexKeysOf<T>]: readonly [Index, Awaited<T[Index]>] }[IndexKeysOf<T>]> {
    // Map each value in the array to a promise of its [index, value] pair
    const promises
        = tupleMap<T, { [Index in keyof T]: Promise<readonly [Index, Awaited<T[Index]>]> }>(
            values,
            async (value, index) => {
                return [index, await value] as const
            }
        )

    return Promise.race(promises) as any
}

