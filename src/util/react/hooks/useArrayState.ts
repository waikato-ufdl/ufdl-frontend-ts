import {Dispatch} from "react";
import useStateSafe from "./useStateSafe";
import useDerivedState from "./useDerivedState";

export class ArrayStateDispatch<T> extends Array<T> {

    private readonly _dispatch?: Dispatch<Array<T>>

    constructor(arrayLength: number);
    constructor(...items: T[]);
    constructor(dispatch: Dispatch<Array<T>>, ...items: T[]);
    constructor(
        first: number | T | Dispatch<Array<T>>,
        ...others: T[]
    ) {
        if (typeof first === "number")
            super(first)
        else if (typeof first === "function") {
            super(...others)
            this._dispatch = first as Dispatch<T[]>
        } else
            super(first, ...others)
    }

    private refresh() {
        if (this._dispatch !== undefined) this._dispatch([...this])
    }

    clear(): this {
        while (super.length > 0) super.pop()
        this.refresh()
        return this
    }

    copyWithin(target: number, start: number, end?: number): this {
        super.copyWithin(target, start, end)
        this.refresh()
        return this;
    }

    fill(value: T, start?: number, end?: number): this {
        super.fill(value, start, end)
        this.refresh()
        return this;
    }

    pop(): T | undefined {
        const result = super.pop()
        this.refresh()
        return result;
    }

    push(...items: T[]): number {
        const result = super.push(...items)
        this.refresh()
        return result;
    }

    reverse(): T[] {
        super.reverse()
        this.refresh()
        return this;
    }

    shift(): T | undefined {
        const result = super.shift()
        this.refresh()
        return result;
    }

    sort(compareFn?: (a: T, b: T) => number): this {
        super.sort(compareFn)
        this.refresh()
        return this;
    }

    splice(start: number, deleteCount?: number): T[];
    splice(start: number, deleteCount: number, ...items: T[]): T[];
    splice(start: number, deleteCount?: number, ...items: T[]): T[] {
        const result = deleteCount === undefined?
            super.splice(start, deleteCount)
            : super.splice(start, deleteCount, ...items)
        this.refresh()
        return result;
    }

    unshift(...items: T[]): number {
        const result = super.unshift(...items)
        this.refresh()
        return result;
    }
}

export default function useArrayState<T>(
    // No parameters
): ArrayStateDispatch<T> {

    const [state, setState] = useStateSafe<T[]>(() => [])

    return useDerivedState(
        ([state, setState]) => new ArrayStateDispatch<T>(setState, ...state),
        [state, setState] as const
    )
}