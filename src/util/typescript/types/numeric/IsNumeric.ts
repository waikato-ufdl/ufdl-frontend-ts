/**
 * Conditional type that resolves to false if N is not a numeric type
 * (a non-negative integer).
 */
export type IsNumeric<N extends number>
    = number extends N
    ? false
    : [][N] extends never
        ? false
        : true
