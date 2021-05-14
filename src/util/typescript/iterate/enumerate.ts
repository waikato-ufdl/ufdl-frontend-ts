import {SelfIterableIterator} from "./SelfIterableIterator";
import iteratorMap from "./map";

/**
 * Returns an iterator over the iterable which prefixes
 * each item in the iteration with its index.
 *
 * @param iterable
 *          The iterable to iterate over.
 * @return
 *          An iterator of index, value pairs.
 */
export default function enumerate<T>(
    iterable: Iterable<T>
): SelfIterableIterator<[number, T]> {
    let index = 0
    return iteratorMap(
        iterable[Symbol.iterator](),
        (value) => [index++, value]
    )
}
