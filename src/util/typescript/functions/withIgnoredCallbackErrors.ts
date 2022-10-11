/**
 * Creates a modified version of a callback which silently ignores any
 * errors that occur when calling the callback.
 *
 * @param callback
 *          The callback to call.
 * @return
 *          The modified version of the callback.
 */
export default function withIgnoredCallbackErrors<Args extends readonly unknown[]>(
    callback: (...args: Args) => void
): (...args: Args) => void {
    return (...args) => {
        try {
            callback(...args)
        } catch (_) {
            // Ignore the error
        }
    }
}