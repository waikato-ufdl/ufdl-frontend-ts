import {KeysWithValueType} from "./types/KeysWithValueType";

/**
 * Maps each owned property of an object into an array
 *
 * @param obj
 *          The object to map.
 * @param body
 *          The mapping function to call for each property.
 * @return
 *          The array of mapped values.
 */
export function mapOwnProperties<T extends object, R>(
    obj: T,
    body: <K extends keyof T>(property: K, value: T[K]) => R
): R[] {
    const result: R[] = []

    forEachOwnProperty(
        obj,
        (property, value) => {
            result.push(
                body(
                    property,
                    value
                )
            )
        }
    )

    return result
}

export function mapObject<S extends object, T extends object, M extends { [TK in keyof T]: keyof S}>(
    obj: S,
    mapFn: {
        [SK in keyof S]:
            (property: SK, value: S[SK]) => { [TK in KeysWithValueType<M, SK, keyof T>]: T[TK] }
    }[keyof S]
): T {
    let result: Partial<T> = {}

    forEachOwnProperty(
        obj,
        (property, value) => {
            const r = mapFn(property, value)
            result = {
                ...result,
                ...r
            }
        }
    )

    return result as T
}

/**
 * Iterates over the owned properties of an object.
 *
 * @param obj
 *          The object to iterate.
 * @param body
 *          The function to call for each property.
 */
export function forEachOwnProperty<T extends object>(
    obj: T,
    body: (property: keyof T, value: T[keyof T]) => void
): void {
    for (const property of ownPropertyIterator(obj)) body(...property)
}

/**
 * Returns an iterator over the owned properties of an object.
 *
 * @param obj
 *          The object to iterate.
 * @return
 *          An iterator over the owned properties of [obj].
 */
export function* ownPropertyIterator<T extends object>(
    obj: T
): Generator<readonly [keyof T, T[keyof T]], void> {
    for (const property in obj) {
        if (!obj.hasOwnProperty(property)) continue;
        yield [property, obj[property]] as const
    }
}

/**
 * Creates a deep-copy of an object.
 *
 * @param obj
 *          The object to copy.
 */
export function deepCopyOwnProperties<T extends object>(
    obj: T
): T {
    const result: Partial<T> = {}

    forEachOwnProperty(
        obj,
        (property, value) => {
            if (typeof value === "object") {
                const copy = deepCopyOwnProperties(value as unknown as object)
                result[property] = copy as unknown as T[keyof T]
            } else {
                result[property] = value
            }
        }
    )

    return result as T
}

/**
 * Omits a single key from an object.
 *
 * Modified from https://stackoverflow.com/a/56156274
 *
 * @param key
 * @param _
 * @param remainder
 */
export function omit<T extends object, K extends keyof T>(
    key: K,
    {[key]: _, ...remainder}: T
): Omit<T, K> {
    return remainder
}

/**
 * Converts a constructor into a plain function.
 *
 * @param cons
 *          The constructor.
 * @return
 *          A plain function taking the same parameters as the given constructor.
 */
export function constructorToFunction<T extends object, P extends readonly unknown[]>(
    cons: new (...args: P) => T
): (...args: P) => T {
    return (...args) => new cons(...args)
}

/**
 * Converts a factory function into a constructor.
 *
 * @param fn
 *          The factory function.
 * @return
 *          A constructor equivalent to the given function.
 */
export function functionToConstructor<T extends object, P extends readonly unknown[]>(
    fn: (...args: P) => T
): new (...args: P) => T {
    return new Proxy(
        fn,
        {
            construct(target: (...args: P) => T, argArray: any, _newTarget?: any): object {
                return target(...argArray)
            }
        }
    ) as any
}

export function hasOwnProperty<T extends {}, K extends PropertyKey>(
    obj: T,
    prop: K
): obj is (T & (K extends PropertyKey ? { [key in K]?: unknown } : never)) {
    return obj.hasOwnProperty(prop)
}
