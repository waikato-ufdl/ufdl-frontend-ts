import {PossiblePromise} from "../types/promise";

export default function isPromise<T>(
    value: PossiblePromise<T>
): value is Promise<T> {
    return value instanceof Promise;
}