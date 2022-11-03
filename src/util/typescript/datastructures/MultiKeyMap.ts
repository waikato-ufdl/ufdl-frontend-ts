import {Head} from "../types/array/Head";
import {Tail} from "../types/array/Tail";
import {mapGetDefault, mapReduce} from "../../map";
import {constantInitialiser} from "../initialisers";
import {head, tail} from "../arrays/slices"
import {SelfIterableIterator} from "../iterate/SelfIterableIterator";
import iterate from "../iterate/iterate";
import iteratorMap from "../iterate/map";
import {any} from "../any";
import isDefined from "../isDefined";
import iteratorFilter from "../iterate/filter";

/** A unique symbol representing the absence of value for a given key. */
const NO_VALUE: unique symbol = Symbol("There is no value for the given key")

export type ReadonlyMultiKeyMap<K extends readonly unknown[], V> = {
    readonly [Symbol.toStringTag]: string
    readonly size: number
    readonly empty: boolean
    get(key: Readonly<K>): V | undefined
    has(key: Readonly<K>): boolean
    keys(): SelfIterableIterator<K>
    values(): SelfIterableIterator<V>
    entries(): SelfIterableIterator<[K, V]>
}

export class MultiKeyMap<K extends readonly unknown[], V>
    implements ReadonlyMultiKeyMap<K, V>
{
    /** Stores the values for zero-length keys. */
    private static TOP_LEVEL_VALUES: Map<MultiKeyMap<any, any>, any> = new Map();

    /** Map from the head of the key to values for those heads. */
    private valueMap: Map<Head<K>, V> | undefined = undefined;

    /** Map from the head of the key to child maps for the key remainder. */
    private childMap: Map<Head<K>, MultiKeyMap<Tail<K>, V>> | undefined = undefined;

    readonly [Symbol.toStringTag]: string = "MultiKeyMap";

    constructor(initial?: Iterable<readonly [K, V]> | undefined) {
        if (isDefined(initial)) {
            for (const [key, value] of initial) {
                this.set(key, value)
            }
        }
    }

    get size(): number {
        const thisLevelSize = this.valueMap !== undefined ? this.valueMap.size : 0;
        const topLevelSize = MultiKeyMap.TOP_LEVEL_VALUES.has(this) ? 1 : 0;
        const childrenSize = this.childMap === undefined
            ? 0
            : mapReduce(
                this.childMap,
                0,
                (current, _, value) =>
                    current + value.size
            );
        return thisLevelSize + topLevelSize + childrenSize;
    }

    get empty(): boolean {
        return this.size === 0;
    }

    clear(): void {
        MultiKeyMap.TOP_LEVEL_VALUES.delete(this);
        this.valueMap = undefined;
        this.childMap = undefined;
    }

    delete(key: Readonly<K>): boolean {
        if (key.length === 0) {
            return MultiKeyMap.TOP_LEVEL_VALUES.delete(this);
        }

        if (key.length === 1) {
            if (this.valueMap === undefined) return false;
            return this.valueMap.delete(head(key));
        }

        if (this.childMap === undefined) return false;

        const childMapForHead = this.childMap.get(head(key));

        if (childMapForHead === undefined) return false;

        const deleted = childMapForHead.delete(tail(key));

        if (deleted) {
            if (childMapForHead.size === 0) this.childMap.delete(head(key));
            if (this.childMap.size === 0) this.childMap = undefined;
        }

        return deleted;
    }

    deleteAll(...keys: Readonly<K>[]): boolean {
        return any(
            this.delete.bind(this),
            ...keys
        )
    }

    keep(...keys: Readonly<K>[]): boolean {
        const keySet = new MultiKeyMap(keys.map(key => [key, undefined] as const))
        const otherKeys = [...iteratorFilter(this.keys(), key => !keySet.has(key))]

        if (otherKeys.length === 0) return false

        for (const key of otherKeys) {
            this.delete(key)
        }

        return true
    }

    private getInternal(key: Readonly<K>): V | typeof NO_VALUE {
        if (key.length === 0) {
            return mapGetDefault(
                MultiKeyMap.TOP_LEVEL_VALUES,
                this,
                constantInitialiser(NO_VALUE),
                false
            );
        }

        if (key.length === 1) {
            if (this.valueMap === undefined) return NO_VALUE;

            return mapGetDefault(
                this.valueMap,
                key[0],
                constantInitialiser(NO_VALUE as V | typeof NO_VALUE),
                false
            );
        }

        if (this.childMap === undefined) return NO_VALUE;

        const childMapForHead = this.childMap.get(head(key));

        if (childMapForHead === undefined) return NO_VALUE;

        return childMapForHead.getInternal(tail(key));
    }

    get(key: Readonly<K>): V | undefined {
        const value = this.getInternal(key);
        return value === NO_VALUE ? undefined : value;
    }

    has(key: Readonly<K>): boolean {
        return this.getInternal(key) !== NO_VALUE;
    }

    set(key: Readonly<K>, value: V): this {
        if (key.length === 0) {
            MultiKeyMap.TOP_LEVEL_VALUES.set(this, value);
            return this;
        }

        if (key.length === 1) {
            if (this.valueMap === undefined) this.valueMap = new Map();
            this.valueMap.set(head(key), value);
            return this;
        }

        if (this.childMap === undefined) this.childMap = new Map();

        let subMapAtHead = this.childMap.get(head(key));

        if (subMapAtHead === undefined) {
            subMapAtHead = new MultiKeyMap();
            this.childMap.set(head(key), subMapAtHead);
        }

        subMapAtHead.set(tail(key), value);

        return this;
    }

    keys(): SelfIterableIterator<K> {
        return iterate(this.generateKeys())
    }

    values(): SelfIterableIterator<V> {
        return iteratorMap(
            this.keys(),
            key => this.get(key)!
        )
    }

    entries(): SelfIterableIterator<[K, V]> {
        return iteratorMap(
            this.keys(),
            key => [key, this.get(key)!]
        )
    }

    private *generateKeys(): Generator<K> {
        if (MultiKeyMap.TOP_LEVEL_VALUES.has(this)) {
            yield [] as unknown as K
        }
        if (this.valueMap !== undefined) {
            for (const key of this.valueMap.keys()) {
                yield [key] as unknown as K
            }
        }
        if (this.childMap !== undefined) {
            for (const [key, child] of this.childMap.entries()) {
                for (const childKey of child.keys()) {
                    yield [key, ...childKey] as unknown as K
                }
            }
        }
    }
}
