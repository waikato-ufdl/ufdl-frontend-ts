import {withNonLocalReturn} from "./typescript/nonLocalReturn";
import iteratorFilter from "./typescript/iterate/filter";

export function isMap(obj: any): obj is (Map<any, any> | ReadonlyMap<any, any>) {
    return obj instanceof Map;
}

export type MapPartitioning<K, V> = {
    kept: Map<K, V>
    removed: Map<K, V>
}

export function partitionMap<K, V>(map: ReadonlyMap<K, V>, filter: (key: K, value: V) => boolean): MapPartitioning<K, V>
export function partitionMap<K, V>(map: ReadonlyMap<K, V>, filter: (key: K, value: V) => boolean, inPlace: false): MapPartitioning<K, V>
export function partitionMap<K, V>(map: Map<K, V>, filter: (key: K, value: V) => boolean, inPlace: true): MapPartitioning<K, V>
export function partitionMap<K, V>(map: Map<K, V>, filter: (key: K, value: V) => boolean, inPlace: boolean): MapPartitioning<K, V>
export function partitionMap<K, V>(
    map: Map<K, V> | ReadonlyMap<K, V>,
    filter: (key: K, value: V) => boolean,
    inPlace: boolean = false
): MapPartitioning<K, V> {
    const result: MapPartitioning<K, V> = {
        kept: inPlace ? map as Map<K, V> : new Map<K, V>(),
        removed: new Map<K, V>()
    };

    if (inPlace) {
        const toDelete = mapToArray(
            map,
            (key, value) => {
                return filter(key, value) ? undefined : [key, value] as const;
            }
        );

        toDelete.forEach(
            (pair) => {
                if (pair !== undefined) {
                    const [key, value] = pair;

                    result.kept.delete(key);
                    result.removed.set(key, value);
                }
            }
        );
    } else {
        map.forEach(
            (value, key) => {
                if (filter(key, value)) {
                    result.kept.set(key, value);
                } else {
                    result.removed.set(key, value);
                }
            }
        );
    }

    return result;
}

export function filterMap<K, V>(map: ReadonlyMap<K, V>, filter: (key: K, value: V) => boolean): Map<K, V>;
export function filterMap<K, V>(map: ReadonlyMap<K, V>, filter: (key: K, value: V) => boolean, inPlace: false): Map<K, V>;
export function filterMap<K, V>(map: Map<K, V>, filter: (key: K, value: V) => boolean, inPlace: true): Map<K, V>;
export function filterMap<K, V>(map: Map<K, V>, filter: (key: K, value: V) => boolean, inPlace: boolean): Map<K, V>;
export function filterMap<K, V>(
    map: Map<K, V> | ReadonlyMap<K, V>,
    filter: (key: K, value: V) => boolean,
    inPlace: boolean = false
): Map<K, V> {
    return partitionMap(map as Map<K, V>, filter, inPlace).kept;
}

export function mapFromArray<K, V, T>(
    array: readonly T[],
    func: (value: T, index: number, array: readonly T[]) => [K, V]
): Map<K, V> {
    return new Map<K, V>(array.map(func))
}

export function mapToArray<K, V, T>(
    map: ReadonlyMap<K, V>,
    func: (key: K, value: V) => T
): T[] {
    const array = new Array(map.size);
    let index = 0;

    map.forEach(
        (value, key) => {
            array[index] = func(key, value);
            index++;
        }
    );

    return array;
}

export function spreadJoinMaps<K, V>(
    ...maps: (ReadonlyMap<K, V> | readonly [K, V])[]
): Map<K, V> {
    const result = new Map<K, V>();
    const setResult = (value: V, key: K) => result.set(key, value);
    for (const map of maps) {
        if (isMap(map)) {
            map.forEach(setResult)
        } else {
            setResult(map[1], map[0]);
        }
    }
    return result;
}

/**
 * Sets the value for the given key, only if no value already exists.
 *
 * @param map
 *          The map to alter.
 * @param key
 *          The key to (possibly) set.
 * @param defaultValue
 *          The initialiser of the value to set if no value already exists.
 */
export function mapSetDefault<K, V>(
    map: Map<K, V>,
    key: K,
    defaultValue: () => V
): boolean {
    if (map.has(key)) return false;
    map.set(key, defaultValue());
    return true;
}

/**
 * Gets the value for a given key from the map, returning a lazily-evaluated
 * default value if the key is not in the map.
 *
 * @param map
 *          The map to get the value from.
 * @param key
 *          The key to find in the map.
 * @param defaultValue
 *          A function which returns a default value, in the case the key isn't found.
 * @return
 *          The value at the given key, or the default value if there is none.
 */
export function mapGetDefault<K, V>(map: ReadonlyMap<K, V>, key: K, defaultValue: () => V): V;

/**
 * Gets the value for a given key from the map, returning a lazily-evaluated
 * default value if the key is not in the map. The calculated default value can
 * optionally be inserted into the map.
 *
 * @param map
 *          The map to get the value from.
 * @param key
 *          The key to find in the map.
 * @param defaultValue
 *          A function which returns a default value, in the case the key isn't found.
 * @param set
 *          Whether to insert the default value into the map if it is used.
 * @return
 *          The value at the given key, or the default value if there is none.
 */
export function mapGetDefault<K, V>(map: Map<K, V>, key: K, defaultValue: () => V, set: boolean): V;

export function mapGetDefault<K, V>(
    map: Map<K, V> | ReadonlyMap<K, V>,
    key: K,
    defaultValue: () => V,
    set?: boolean
): V {
    if (map.has(key)) return map.get(key) as V;
    const def = defaultValue();
    if (set === true) (map as Map<K, V>).set(key, def);
    return def;
}

export function copyMap<K, V>(
    map: ReadonlyMap<K, V>,
    alteration?: (key: K, value: V) => [K, V] | boolean
): Map<K, V> {
    let mapInitialiser: [K, V][] = [...map];

    if (alteration !== undefined) {
        const alterationActual = (key: K, value: V) => {
            const alterationResult = alteration(key, value);
            if (alterationResult === true) {
                return [key, value] as const;
            } else if (alterationResult === false) {
                return undefined;
            } else {
                return alterationResult;
            }
        };

        mapInitialiser = mapInitialiser.map(
            ([key, value]) => alterationActual(key, value)
        ).filter(
            (value) => value !== undefined
        ) as [K, V][];
    }

    return new Map(mapInitialiser);
}

export function cloneMap<K, V>(
    source: ReadonlyMap<K, V>,
    destination: Map<K, V>,
    clearFirst: boolean = true
): void {
    if (clearFirst) destination.clear();

    source.forEach(
        (value, key) => {
            destination.set(key, value);
        }
    )
}

export function mapHasValue<K, V>(
    map: ReadonlyMap<K, V>,
    value: V
): boolean {
    return mapAny(map, (_, mapValue) => value === mapValue)
}

export function mapAny<K, V>(
    map: ReadonlyMap<K, V>,
    predicate: (key: K, value: V) => boolean
): boolean {
    return withNonLocalReturn<boolean>(
        (nonLocalReturn) => {
            map.forEach(
                (value, key) => {
                    if (predicate(key, value)) nonLocalReturn(true);
                }
            );
            return false;
        }
    )
}

export function mapAll<K, V>(
    map: ReadonlyMap<K, V>,
    predicate: (key: K, value: V) => boolean
) {
    return !mapAny(map, (key, value) => !predicate(key, value))
}

export function mapReduce<K, V, T>(
    map: ReadonlyMap<K, V>,
    initial: T,
    accumulator: (current: T, key: K, value: V) => T
): T {
    let total: T = initial;
    map.forEach(
        (value, key) => {
            total = accumulator(total, key, value);
        }
    );
    return total;
}

/**
 * Adds all [key, value] pairs yielded by the iterator to
 * the [map], in the order yielded (i.e. subsequent values
 * override prior values for the same key).
 *
 * @param map
 *          The map to add the entries to.
 * @param entries
 *          An iterator over the entries to add.
 */
export function mapAddAll<K, V>(
    map: Map<K, V>,
    entries: Iterable<readonly [K, V]>
): void {
    for (const [key, value] of entries) {
        map.set(key, value);
    }
}

/**
 * Maps a map from one key/value type to another.
 *
 * @param map
 *          The source map.
 * @param func
 *          A function which yields a number of [key, value]
 *          pairs for a given entry in the source map.
 * @return
 *          The generated map.
 */
export function mapMap<K, V, K2, V2>(
    map: ReadonlyMap<K, V>,
    func: (key: K, value: V) => readonly (readonly [K2, V2])[]
): Map<K2, V2> {
    const result: Map<K2, V2> = new Map()

    for (const [key, value] of map.entries()) {
        mapAddAll(result, func(key, value))
    }

    return result;
}

/**
 * Creates an object containing the same properties as the
 * keys of the given map.
 *
 * @param map
 *          The source map.
 * @return
 *          The generated object.
 */
export function mapToObject<V>(
    map: ReadonlyMap<string, V>
): { [key: string]: V } {
    const result: { [key: string]: V } = {}

    for (const [key, value] of map.entries()) {
        result[key] = value
    }

    return result;
}

export function mapSort<K, V, M extends Map<K, V>>(
    map: M,
    compareFn?: (a: readonly [K, V], b: readonly [K, V]) => number
): M {
    const entries = [...map.entries()]
    entries.sort(compareFn)
    map.clear()
    for (const [key, value] of entries) {
        map.set(key, value)
    }
    return map
}

export function mapKeep<K, V>(
    map: Map<K, V>,
    ...keys: K[]
): boolean {
    const keySet = new Set(keys)
    const otherKeys = [...iteratorFilter(map.keys(), key => !keySet.has(key))]

    if (otherKeys.length === 0) return false

    for (const key of otherKeys) {
        map.delete(key)
    }

    return true
}