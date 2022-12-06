/**
 * Equivalent to a try/catch construct, but can be used as an expression.
 *
 * @param tryBlock
 *          The code to try.
 * @param catchBlock
 *          The code to execute if the try-block throws.
 * @return
 *          The result of the try-block, or the result of the
 *          catch-block if the try-block throws.
 */
export default function tryExpression<T, E>(
    tryBlock: () => T,
    catchBlock: (error: unknown) => E
): T | E {
    try {
        return tryBlock()
    } catch (e: unknown) {
        return catchBlock(e)
    }
}
