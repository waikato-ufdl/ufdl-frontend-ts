/**
 * The type of an object that has no properties.
 */
export type Empty = { readonly [key in any]?: never }

/** Constant object matching the Empty type. */
export const EMPTY: Empty = {};
