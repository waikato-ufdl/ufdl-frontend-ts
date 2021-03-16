export type IsNumeric<N extends number>
    = number extends N
    ? never
    : [][N] extends never
        ? never
        : N
