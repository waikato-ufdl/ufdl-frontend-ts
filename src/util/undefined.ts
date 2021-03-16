import {Optional} from "ufdl-js-client/util";

export function ifNotUndefined<T, R>(value: Optional<T>, func: (value: T) => R): Optional<R> {
    if (value === undefined)
        return undefined;
    else
        return func(value);
}
