/**
 * From T, pick a set of properties whose values are assignable to V.
 */
export type KeysWithValueType<T, V> = Exclude<
    Required<{ [K in keyof T]: V extends T[K] ? K : false }>[keyof T],
    false
>