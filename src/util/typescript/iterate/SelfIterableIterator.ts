/** Object which is an iterator, and an iterable which returns itself. */
export interface SelfIterableIterator<T, TReturn = any, TNext = undefined>
    extends Iterator<T, TReturn, TNext>
{
    [Symbol.iterator](): this
}
