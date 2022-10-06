/**
 * Makes a procedure idempotent. Calling the return function will
 * call the wrapped function on first invocation, and do nothing
 * on all subsequent invocations.
 *
 * @param func
 *          The procedure to wrap.
 * @return
 *          A one-shot equivalent of the wrapped function.
 */
export default function oneShot<P extends  readonly unknown[]>(
    func: (...args: P) => void
): (...args: P) => void {
    //  Create state of what to call next, the function or nothing
    let toCall: ((...args: P) => void) | null = func

    return (...args: P) => {
        if (toCall !== null) {
            toCall(...args)
            toCall = null
        }
    }
}
