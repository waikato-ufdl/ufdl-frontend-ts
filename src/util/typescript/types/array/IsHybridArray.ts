import {DefiniteIndexType} from "./DefiniteIndexType";

/**
 * Whether the type T is a hybrid array (an array which has
 * a non-zero minimum size, expressed as [A, B, ...C[]]).
 */
export type IsHybridArray<T>
    = T extends readonly unknown[]
    ? number extends T['length']
        ? DefiniteIndexType<T> extends never
            ? false
            : true
        : false
    : false
