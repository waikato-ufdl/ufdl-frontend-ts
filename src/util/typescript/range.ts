import {BIG_INT_MINUS_ONE, BIG_INT_ONE, BIG_INT_ZERO} from "./bigint/constants";

export default function range(end: number): Range<number>;
export default function range(start: number, end: number): Range<number>;
export default function range(start: number, end: number, step: number): Range<number>;
export default function range(end: bigint): Range<bigint>;
export default function range(start: bigint, end: bigint): Range<bigint>;
export default function range(start: bigint, end: bigint, step: bigint): Range<bigint>;
export default function range(
    ...args: any
): Range<number> | Range<bigint> {
    if (typeof args[0] === "number") {
        let [start, end, step]: [number, number?, number?] = args as any
        if (end === undefined) {
            end = start
            start = 0
        }
        if (step === undefined) {
            step = end < start ? -1 : 1
        }
        return new NumberRange(start, end, step)
    } else {
        let [start, end, step]: [bigint, bigint?, bigint?] = args as any
        if (end === undefined) {
            end = start
            start = BIG_INT_ZERO
        }
        if (step === undefined) {
            step = end < start ? BIG_INT_MINUS_ONE : BIG_INT_ONE
        }
        return new BigIntRange(start, end, step)
    }
}

export abstract class Range<T extends number | bigint> implements Iterable<T> {
    protected readonly start: T;
    protected readonly end: T;
    protected readonly step: T;

    constructor(
        start: T,
        end: T,
        step: T
    ) {
        this.start = start;
        this.end = end;
        this.step = step;
    }

    [Symbol.iterator](): Iterator<T> {
        return new this.Iterator(this);
    }

    protected abstract incr(value: T): T;

    public abstract reversed(): Range<T>;

    private Iterator = class implements Iterator<T> {
        private source: Range<T>;
        private nextValue: T;

        constructor(source: Range<T>) {
            this.source = source;
            this.nextValue = source.start
        }

        next(): IteratorResult<T> {
            const done = this.source.step < 0
                ? this.nextValue <= this.source.end
                : this.nextValue >= this.source.end

            if (done) {
                return {done: true, value: undefined}
            }

            const result = this.nextValue;
            this.nextValue = this.source.incr(this.nextValue)
            return {value: result};
        }
    }

}

export class NumberRange extends Range<number> {
    protected incr(value: number): number {
        return value + this.step;
    }

    reversed(): Range<number> {
        if (this.step === 0) return this;

        const numSteps = Math.floor((this.end - this.start) / this.step)

        return new NumberRange(
            this.start + this.step * (numSteps - 1), // this.start is the first step
            this.start - this.step,
            -this.step
        )
    }
}

export class BigIntRange extends Range<bigint> {
    protected incr(value: bigint): bigint {
        return value + this.step;
    }

    reversed(): Range<bigint> {
        if (this.step === BIG_INT_ZERO) return this;

        const numSteps = (this.end - this.start) / this.step

        return new BigIntRange(
            this.start + this.step * (numSteps - BIG_INT_ONE), // this.start is the first step
            this.start - this.step,
            -this.step
        )
    }
}
