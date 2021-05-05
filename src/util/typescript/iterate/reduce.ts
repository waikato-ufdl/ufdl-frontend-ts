import asIterable from "./asIterable";

/**
 * Performs a reduction over the items of an iterator.
 *
 * @param iter
 *          The iterator.
 * @param reduction
 *          The reduction.
 * @param initial
 *          The seed value.
 * @return
 *          The result of the reduction.
 */
export function iteratorReduce<T, R>(
    iter: Iterator<T>,
    reduction: (acc: R, next: T) => R,
    initial: R
): R {
    // Perform the reduction for each item
    for (const item of asIterable(iter))
        initial = reduction(initial, item);

    return initial;
}
