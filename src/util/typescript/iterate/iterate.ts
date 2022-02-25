import {SelfIterableIterator} from "./SelfIterableIterator";
import asIterable from "./asIterable";
/**
 * Gets an iterator over the iterable.
 *
 * @param iterable
 *          The iterable to iterate.
 * @return
 *          The iterator.
 */
export default function iterate<T>(
    iterable: Iterable<T>
): SelfIterableIterator<T> {
    return asIterable(iterable[Symbol.iterator]());
}
