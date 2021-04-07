import {Head, Tail} from "../../tuple";
import {mapAll, mapReduce} from "../../map";
import {Absent, absentAsUndefined, isPresent, Possible} from "../types/Possible";

export class MultiKeyMap<K extends readonly any[], V>
    // implements Map<K, V>
{
    private value: Possible<V> = Absent;

    private subMap: Map<Head<K>, MultiKeyMap<Tail<K>, V>> | undefined = undefined;

    readonly [Symbol.toStringTag]: string = "MultiKeyMap";

    get size(): number {
        return (isPresent(this.value) ? 1 : 0) + (
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
        if (isPresent(this.value))
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
        this.value = Absent;
        this.subMap = undefined;
    }

    delete(key: Readonly<K>): boolean {
        if (key.length === 0) {
            const present: boolean = isPresent(this.value);
            this.value = Absent;
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

    private getInternal(key: Readonly<K>): Possible<V> {
        if (key.length === 0) {
            return this.value;
        }

        if (this.subMap === undefined) return Absent;

        const [head, ...tail] = key;

        const subMapAtHead = this.subMap.get(head);

        if (subMapAtHead === undefined) return Absent;

        return subMapAtHead.getInternal(tail as Tail<K>);
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