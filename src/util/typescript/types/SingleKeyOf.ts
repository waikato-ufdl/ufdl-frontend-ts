/**
 * TODO: Somehow enforces the compiler to infer the type that is a single
 *       type out of a union???
 */
export type SingleKeyOf<T> = T extends never ? T : never
