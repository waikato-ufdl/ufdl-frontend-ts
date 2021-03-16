import {KeysWithValueType} from "./KeysWithValueType";

/**
 * Gets the keys of T which can accept undefined as a value.
 */
export type UndefinableKeys<T> = KeysWithValueType<T, undefined>
