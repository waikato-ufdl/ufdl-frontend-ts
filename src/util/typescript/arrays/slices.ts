import {Head} from "../types/array/Head";
import {Tail} from "../types/array/Tail";
import {Lead} from "../types/array/Lead";
import {End} from "../types/array/End";

export class IndexOutOfBoundsError extends Error {
    constructor(index: number, array: readonly unknown[]) {
        super(`Index ${index} is out-of-bounds for array of length ${array.length}`);
    }

    public static test(index: number, array: readonly unknown[]) {
        if (!(0 <= index && index < array.length))
            throw new IndexOutOfBoundsError(index, array);
    }
}

export function head<A extends readonly unknown[]>(
    array: A
): Head<A> {
    IndexOutOfBoundsError.test(0, array);
    return array[0] as Head<A>;
}

export function tail<A extends readonly unknown[]>(
    array: A
): Tail<A> {
    IndexOutOfBoundsError.test(0, array);
    return array.slice(1) as Tail<A>;
}

export function lead<A extends readonly unknown[]>(
    array: A
): Lead<A> {
    IndexOutOfBoundsError.test(0, array);
    return array.slice(0, -1) as Lead<A>;
}

export function end<A extends readonly unknown[]>(
    array: A
): End<A> {
    IndexOutOfBoundsError.test(0, array);
    return array[array.length - 1] as End<A>;
}
