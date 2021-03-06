import {isReturnResult} from "./result";
import asIterable from "./asIterable";
import {SelfIterableIterator} from "./SelfIterableIterator";

/**
 * Returns an iterator which filters out values from the source iterator.
 *
 * @param iter
 *          The source iterator.
 * @param filter
 *          The function to filter values from the iterator.
 * @return
 *          The filtered iterator.
 */
export default function iteratorFilter<T, TReturn = any, TNext = undefined>(
    iter: Iterator<T, TReturn, TNext>,
    filter: (value: T) => boolean
): SelfIterableIterator<T,  TReturn, TNext> {
    return asIterable(
        {
            next(...args: [] | [TNext]): IteratorResult<T, TReturn> {
                let result = iter.next(...args);
                while (!isReturnResult(result) && !filter(result.value)) result = iter.next(...args);
                return result;
            },
            return: iter.return?.bind(iter),
            throw: iter.throw?.bind(iter)
        }
    );
}
