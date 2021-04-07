import {Absent, Possible} from "../types/Possible";

/**
 * Internal box-type representing an element in the linked-list.
 */
type Element<V> = {
    /** The value at this element. */
    value: V
    /** The previous element in the list. */
    prev?: Element<V>
    /** The next element in the list. */
    next?: Element<V>
}

/**
 * A doubly-linked list.
 */
export class DoublyLinkedList<V> {
    /** The first element in the list. */
    private head?: Element<V> = undefined;

    /** The last element in the list. */
    private tail?: Element<V> = undefined;

    constructor(...items: V[]) {
        for (const item of items) this.append(item);
    }

    [Symbol.iterator]() {
        let current = this.head;

        return {
            next() {
                if (current === undefined)
                    return {done: true};
                else {
                    const result = {value: current.value};
                    current = current.next;
                    return result;
                }
            }
        }
    }

    first(): Possible<V> {
        return this.head === undefined ? Absent : this.head.value;
    }

    last(): Possible<V> {
        return this.tail === undefined ? Absent : this.tail.value;
    }

    empty(): boolean {
        return this.head === undefined;
    }

    get size(): number {
        let size = 0;
        let p = this.head;
        while (p !== undefined) {
            size++;
            p = p.next;
        }
        return size;
    }

    prepend(value: V) {
        const newHead = {
            value: value,
            next: this.head
        };

        if (this.head !== undefined)
            this.head.prev = newHead;
        else
            this.tail = newHead;

        this.head = newHead;
    }

    append(value: V) {
        const newTail = {
            value: value,
            prev: this.tail
        };

        if (this.tail !== undefined)
            this.tail.next = newTail;
        else
            this.head = newTail;

        this.tail = newTail;
    }

    popFirst(): Possible<V> {
        if (this.head === undefined) return Absent;

        const result = this.head.value;

        this.head = this.head.next;

        if (this.head === undefined)
            this.tail = undefined;
        else
            this.head.prev = undefined;

        return result;
    }

    popLast(): Possible<V> {
        if (this.tail === undefined) return Absent;

        const result = this.tail.value;

        this.tail = this.tail.prev;

        if (this.tail === undefined)
            this.head = undefined;
        else
            this.tail.next = undefined;

        return result;
    }
}