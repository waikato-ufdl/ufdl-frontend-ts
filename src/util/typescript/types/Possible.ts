/**
 * Symbol representing the absence of a value.
 */
export const Absent = Symbol("Absent");

/**
 * The type representing either a value of type T, or no value whatsoever.
 */
export type Possible<T> = T | typeof Absent
