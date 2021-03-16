import {Head, Tail} from "../tuple";
import {mapAll, mapReduce} from "../map";

const NOT_RESIDENT = Symbol();

export class MultiKeyMap<K extends readonly any[], V>
    // implements Map<K, V>
{
    private value: V | typeof NOT_RESIDENT = NOT_RESIDENT;
    private subMap: Map<Head<K>, MultiKeyMap<Tail<K>, V>> | undefined = undefined;

    readonly [Symbol.toStringTag]: string = "MultiKeyMap";

    get size(): number {
        return (this.value === NOT_RESIDENT ? 0 : 1) + (
            this.subMap === undefined ?
                0 :
                mapReduce(
                    this.subMap,
                    0,
                    (current, _, value) =>
                        current + value.size
                )
        )
    }

    get empty(): boolean {
        if (this.value !== NOT_RESIDENT)
            return false;
        else if (this.subMap === undefined)
            return true;
        else if (this.subMap.size === 0)
            return true;
        else
            return mapAll(
                this.subMap,
                (
                    _,
                    subMap
                ) => {
                    return subMap.empty;
                }
            );
    }

    clear(): void {
        this.value = NOT_RESIDENT;
        this.subMap = undefined;
    }

    delete(key: Readonly<K>): boolean {
        if (key.length === 0) {
            const present: boolean = this.value !== NOT_RESIDENT;
            this.value = NOT_RESIDENT;
            return present;
        }

        if (this.subMap === undefined) return false;

        const [head, ...tail] = key;

        const subMapAtHead = this.subMap.get(head);

        if (subMapAtHead === undefined) return false;

        const deleted = subMapAtHead.delete(tail as Tail<K>);

        if (deleted) {
            if (subMapAtHead.size === 0) this.subMap.delete(head);
            if (this.subMap.size === 0) this.subMap = undefined;
        }

        return deleted;
    }

    private getInternal(key: Readonly<K>): V | typeof NOT_RESIDENT {
        if (key.length === 0) {
            return this.value;
        }

        if (this.subMap === undefined) return NOT_RESIDENT;

        const [head, ...tail] = key;

        const subMapAtHead = this.subMap.get(head);

        if (subMapAtHead === undefined) return NOT_RESIDENT;

        return subMapAtHead.getInternal(tail as Tail<K>);
    }

    get(key: Readonly<K>): V | undefined {
        const value = this.getInternal(key);
        return value === NOT_RESIDENT ? undefined : value;
    }

    has(key: Readonly<K>): boolean {
        return this.getInternal(key) !== NOT_RESIDENT;
    }

    set(key: Readonly<K>, value: V): this {
        if (key.length === 0) {
            this.value = value;
            return this;
        }

        if (this.subMap === undefined) this.subMap = new Map();

        const [head, ...tail] = key;

        let subMapAtHead = this.subMap.get(head);

        if (subMapAtHead === undefined) {
            subMapAtHead = new MultiKeyMap();
            this.subMap.set(head, subMapAtHead);
        }

        subMapAtHead.set(tail as Tail<K>, value);

        return this;
    }
}