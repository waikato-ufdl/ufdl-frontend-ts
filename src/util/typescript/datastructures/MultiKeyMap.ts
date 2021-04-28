import {Head} from "../types/array/Head";
import {Tail} from "../types/array/Tail";
import {mapGetDefault, mapReduce} from "../../map";
import {Absent, absentAsUndefined, isPresent, Possible} from "../types/Possible";
import {constantInitialiser} from "../initialisers";


export class MultiKeyMap<K extends readonly any[], V>
    // implements Map<K, V>
{
    /** Stores the values for zero-length keys. */
    private static TOP_LEVEL_VALUES: Map<MultiKeyMap<any, any>, any> = new Map();

    /** Map from the head of the key to values for those heads. */
    private valueMap: Map<Head<K>, V> | undefined = undefined;

    /** Map from the head of the key to child maps for the key remainder. */
    private childMap: Map<Head<K>, MultiKeyMap<Tail<K>, V>> | undefined = undefined;

    readonly [Symbol.toStringTag]: string = "MultiKeyMap";

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
            return this.valueMap.delete(key[0]);
        }

        if (this.childMap === undefined) return false;

        const [head, ...tail] = key;

        const childMapForHead = this.childMap.get(head);

        if (childMapForHead === undefined) return false;

        const deleted = childMapForHead.delete(tail as Tail<K>);

        if (deleted) {
            if (childMapForHead.size === 0) this.childMap.delete(head);
            if (this.childMap.size === 0) this.childMap = undefined;
        }

        return deleted;
    }

    private getInternal(key: Readonly<K>): Possible<V> {
        if (key.length === 0) {
            return mapGetDefault(MultiKeyMap.TOP_LEVEL_VALUES, this, constantInitialiser(Absent), false);
        }

        if (key.length === 1) {
            if (this.valueMap === undefined) return Absent;
            return mapGetDefault(this.valueMap as ReadonlyMap<Head<K>, V | typeof Absent>, key[0], constantInitialiser(Absent), false);
        }

        if (this.childMap === undefined) return Absent;

        const [head, ...tail] = key;

        const childMapForHead = this.childMap.get(head);

        if (childMapForHead === undefined) return Absent;

        return childMapForHead.getInternal(tail as Tail<K>);
    }

    get(key: Readonly<K>): V | undefined {
        const value = this.getInternal(key);
        return absentAsUndefined(value);
    }

    has(key: Readonly<K>): boolean {
        return isPresent(this.getInternal(key));
    }

    set(key: Readonly<K>, value: V): this {
        if (key.length === 0) {
            MultiKeyMap.TOP_LEVEL_VALUES.set(this, value);
            return this;
        }

        if (key.length === 1) {
            if (this.valueMap === undefined) this.valueMap = new Map();
            this.valueMap.set(key[0], value);
            return this;
        }

        if (this.childMap === undefined) this.childMap = new Map();

        const [head, ...tail] = key;

        let subMapAtHead = this.childMap.get(head);

        if (subMapAtHead === undefined) {
            subMapAtHead = new MultiKeyMap();
            this.childMap.set(head, subMapAtHead);
        }

        subMapAtHead.set(tail as Tail<K>, value);

        return this;
    }
}
