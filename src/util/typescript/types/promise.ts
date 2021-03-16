/**
 * Type which is either a value or the promise of a value.
 */
export type PossiblePromise<T> = T | Promise<T>

export type PromisedType<P extends Promise<any>> = P extends Promise<infer T> ? T : never;

export type CollapsedPromisedType<T> = T extends Promise<infer S> ? CollapsedPromisedType<S> : T

export type CollapsedPromise<T> = Promise<CollapsedPromisedType<T>>
