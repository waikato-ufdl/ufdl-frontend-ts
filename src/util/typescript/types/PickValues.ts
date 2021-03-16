import {KeysWithValueType} from "./KeysWithValueType";

/**
 * Picks the properties of T that can be assigned values of type V.
 */
export type PickValues<T, V> = Pick<T, KeysWithValueType<T, V>>
