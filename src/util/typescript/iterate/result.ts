/**
 * Tests if the given iterator result is a return-result.
 *
 * @param result
 *          The result to test.
 * @return
 *          Whether it is a return-result.
 */
export function isReturnResult<T, TReturn = any>(
    result: IteratorResult<T, TReturn>
): result is IteratorReturnResult<TReturn> {
    return result.done === true
}

/**
 * Tests if the given iterator result is a yield-result.
 *
 * @param result
 *          The result to test.
 * @return
 *          Whether it is a yield-result.
 */
export function isYieldResult<T, TReturn = any>(
    result: IteratorResult<T, TReturn>
): result is IteratorYieldResult<T> {
    return result.done !== true
}
