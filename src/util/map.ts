import {withNonLocalReturn} from "./typescript/nonLocalReturn";

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
    ...maps: (ReadonlyMap<K, V> | [K, V])[]
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