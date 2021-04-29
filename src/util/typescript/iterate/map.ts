/**
 * Maps values yield from an iterator from one type to another.
 *
 * @param iter
 *          The iterator.
 * @param yieldMap
 *          The mapping function.
 * @return
 *          An iterator over the mapped values.
 */
export default function iteratorMap<T, R, TReturn = any, TNext = undefined>(
    iter: Iterator<T, TReturn, TNext>,
    yieldMap: (value: T) => R
): Iterator<R, TReturn, TNext> {

    const iterReturn = iter.return === undefined ? undefined : iter.return.bind(iter);
    const iterThrow = iter.throw === undefined ? undefined : iter.throw.bind(iter);

    const mappedReturn = iterReturn === undefined
        ? undefined
        : (value?: TReturn) => iteratorMapResult(iterReturn(value), yieldMap)

    const mappedThrow = iterThrow === undefined
        ? undefined
        : (e?: any) => iteratorMapResult(iterThrow(e), yieldMap)

    return {
        next(...args) {
            return iteratorMapResult(iter.next(...args), yieldMap);
        },
        return: mappedReturn,
        throw: mappedThrow,
    }
}

/**
 * Maps an iterator result from one type to another.
 *
 * @param result
 *          The result to map.
 * @param yieldMap
 *          The mapping function.
 * @return
 *          The mapped result.
 */
export function iteratorMapResult<T, R, TReturn = any>(
    result: IteratorResult<T, TReturn>,
    yieldMap: (value: T) => R
): IteratorResult<R, TReturn> {
    // Only mapping yield-results, just return return-results as-is
    if (result.done === true) return result;

    return {
        done: result.done,
        value: yieldMap(result.value)
    }
}
