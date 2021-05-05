import {SelfIterableIterator} from "./SelfIterableIterator";
import asIterable from "./asIterable";

/**
 * Returns an iterable iterator over the literal [items]
 * given in the order of declaration.
 *
 * @param items
 *          The items to iterate over.
 * @return
 *          An iterator over the items.
 */
export default function iterateLiteral<T>(
    ...items: T[]
): SelfIterableIterator<T> {
    return asIterable(
        items[Symbol.iterator]()
    )
}
