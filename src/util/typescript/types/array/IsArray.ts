/**
 * Whether the type T is an array type.
 */
export type IsArray<T>
    = T extends readonly unknown[]
    ? true
    : false
