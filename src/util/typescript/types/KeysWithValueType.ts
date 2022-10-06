/**
 * From T, pick a set of properties whose values are assignable to V.
 */
export type KeysWithValueType<T, V, K extends keyof T = keyof T> = Required<{ [TK in keyof T]: T[TK] extends V ? TK : never }>[K]
