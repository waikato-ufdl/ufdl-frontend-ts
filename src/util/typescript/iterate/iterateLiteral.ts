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
): IterableIterator<T> {
    return items[Symbol.iterator]()
}
