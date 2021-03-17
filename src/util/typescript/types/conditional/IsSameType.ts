/**
 * Type which evaluates to the true type if A and B are the same type,
 * and the false type if not.
 */
export type IsSameType<A, B>
    = Exclude<A, B> extends never
    ? Exclude<B, A> extends never
        ? true
        : false
    : false
