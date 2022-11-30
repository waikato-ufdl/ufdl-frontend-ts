import enumerate from "../iterate/enumerate";
import {tupleMap} from "../arrays/tuple";

/**
 * Returns a promise which awaits all the values of the given keys
 * of the given object.
 *
 * @param values
 *          The object mapping keys to awaitables.
 * @param keys
 *          The keys (properties) of the object to await.
 * @return
 *          An object mapping the awaited keys to the awaited values.
 */
export async function allKeyed<T extends { [key in PropertyKey]: unknown }, K extends readonly (keyof T)[]>(
    values: T,
    keys: K
): Promise<{ [Key in K[number]]?: Awaited<T[Key]> }> {

    // Keep a cache of the keys we've already processed, so we don't create
    // duplicates for duplicate keys
    const promises: { [Key in K[number]]?: Promise<T[Key]> }
        = {}

    // Map each key to the promise of its value's resolution, utilising
    // the cache to short-circuit on duplicate keys
    const promiseArray
        = tupleMap<K, { [Index in keyof K]: Promise<T[K[Index]]> }>(
            keys,
            (key) => {
                // Check the cache for this key
                const current = promises[key]
                if (current !== undefined) return current

                // Get the key's value's resolution promise
                const promise = Promise.resolve(values[key])

                // Cache it in case this key comes up again
                promises[key] = promise

                return promise
            }
        )

    // Await all promises
    const awaitedArray = await Promise.all(promiseArray) as { [Index in keyof K]: Awaited<T[K[Index]]> }

    // Build the result object from the keys to the awaited results
    const results: { [Key in K[number]]?: Awaited<T[Key]> } = {}
    for (const [index, key] of enumerate(keys)) {
        if (!(key in results)) {
            results[key] = awaitedArray[index]
        }
    }

    return results
}