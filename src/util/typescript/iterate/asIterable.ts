import {SelfIterableIterator} from "./SelfIterableIterator";
/**
 * Returns an object that implements the iterable interface, with
 * the given iterator as its iterator.
 *
 * @param iter
 *          The source iterator.
 * @return
 *          An equivalent iterable-iterator.
 */
export default function asIterable<T, TReturn = any, TNext = undefined>(
    iter: Iterator<T, TReturn, TNext>
): SelfIterableIterator<T, TReturn, TNext> {
    return {
        [Symbol.iterator]() {
            return this;
        },
        next(...args: any) { return iter.next(...args) },
        return: iter.return?.bind(iter),
        throw: iter.throw?.bind(iter)
    }
}