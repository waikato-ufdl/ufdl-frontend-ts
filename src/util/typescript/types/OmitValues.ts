import {KeysWithValueType} from "./KeysWithValueType";

/**
 * Picks the properties of T that cannot be assigned values of type V.
 */
export type OmitValue<T, V> = Omit<T, KeysWithValueType<T, V>>
