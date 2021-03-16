/**
 * Conditional type that resolves to never if N is not a numeric type
 * (a non-negative integer).
 */
export type IsNumeric<N extends number>
    = number extends N
    ? never
    : [][N] extends never
        ? never
        : N
