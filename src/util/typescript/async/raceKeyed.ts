import {tupleMap} from "../arrays/tuple";

/**
 * Returns a promise which awaits the first of the given keys whose
 * value in the given object resolves.
 *
 * @param values
 *          The object mapping keys to awaitables.
 * @param keys
 *          The keys (properties) of the object to race.
 * @return
 *          A pair of the first [key, value] to resolve.
 */
export function raceKeyed<T extends { [key in PropertyKey]: unknown }, K extends readonly (keyof T)[]>(
    values: T,
    keys: K
): Promise<{ [Key in K[number]]: readonly [Key, Awaited<T[Key]>] }[K[number]]> {

    // Keep a cache of the keys we've already processed, so we don't create
    // duplicates for duplicate keys
    const promises: { [Key in K[number]]?: Promise<readonly [Key, Awaited<T[Key]>]> }
        = {}

    // Map each key to the promise of the tuple of the key itself, and its value's resolution,
    // utilising the cache to short-circuit on duplicate keys
    const promiseArray = tupleMap<K, { [I in keyof K]: Promise<readonly [K[I], T[K[I]]]> }>(
        keys,
        (key) => {
            // Check the cache for this key
            const current = promises[key]
            if (current !== undefined) return current

            // Get the key's value's resolution promise
            const promise = (async () => {
                return [key, await values[key]] as const
            })()

            // Cache it in case this key comes up again
            promises[key] = promise

            return promise
        }
    )

    return Promise.race(promiseArray) as Promise<{ [Key in K[number]]: readonly [Key, Awaited<T[Key]>] }[K[number]]>

}