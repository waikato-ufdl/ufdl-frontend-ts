export class Stack<T> {
    _stack: T[];

    constructor(...items: T[]) {
        this._stack = items;
    }

    get size(): number {
        return this._stack.length;
    }

    get empty(): boolean {
        return this._stack.length === 0
    }

    peek(): T {
        return this._stack[0];
    }

    pop(): T {
        const [head, ...tail] = this._stack;
        this._stack = tail;
        return head;
    }

    push(item: T): void {
        this._stack = [item, ...this._stack];
    }

}
