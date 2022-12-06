/**
 * Asynchronous version of {@link tryExpression}.
 *
 * @param tryBlock
 *          The code to try.
 * @param catchBlock
 *          The code to execute if the try-block throws.
 * @return
 *          The result of the try-block, or the result of the
 *          catch-block if the try-block throws.
 */
export default async function asyncTryExpression<T, E>(
    tryBlock: () => Promise<T>,
    catchBlock: (error: unknown) => E
): Promise<T | E> {
    try {
        return await tryBlock()
    } catch (e: unknown) {
        return catchBlock(e)
    }
}
