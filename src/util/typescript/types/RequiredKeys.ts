import {OptionalKeys} from "./OptionalKeys";

/**
 * Gets the required keys of T.
 */
export type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>
