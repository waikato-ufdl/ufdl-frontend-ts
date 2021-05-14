import asIterable from "./asIterable";
import {SelfIterableIterator} from "./SelfIterableIterator";
import {isReturnResult} from "./result";

/**
 * Concatenates iterators by iterating over each in turn in the
 * order given.
 *
 * @param iterators
 *          The iterators to concatenate.
 * @return
 *          An iterator over the concatenation.
 */
export default function iteratorConcat<T>(
    ...iterators: Iterator<T>[]
): SelfIterableIterator<T> {
    // Get an iterator over the iterators supplied
    const iteratorIterator = iterators[Symbol.iterator]()

    // Initialise with the first iterator
    let iteratorIteratorNext = iteratorIterator.next()

    return asIterable(
        {
            next(): IteratorResult<T> {
                // Keep getting results until a yield is found from an iterator
                while (!isReturnResult(iteratorIteratorNext)) {
                    const result = iteratorIteratorNext.value.next()
                    if (!isReturnResult(result)) return result;
                    iteratorIteratorNext = iteratorIterator.next();
                }

                // If all iterators are exhausted, return the result of the
                // concatenating iterator
                return iteratorIteratorNext;
            }
        }
    );
}
