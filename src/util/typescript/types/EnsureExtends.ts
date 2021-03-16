/**
 * Helper-type that will fail to compile if T does not extend B.
 */
export type EnsureExtends<T, B> = T extends B ? T : EnsureExtends<T, B>
