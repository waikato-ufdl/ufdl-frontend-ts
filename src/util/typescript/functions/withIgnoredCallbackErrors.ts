/**
 * Creates a modified version of a callback which silently ignores any
 * errors that occur when calling the callback.
 *
 * @param callback
 *          The callback to call.
 * @return
 *          The modified version of the callback.
 */
export default function withIgnoredCallbackErrors<Args extends readonly unknown[], R>(
    callback: (...args: Args) => R
): (...args: Args) => R | undefined {
    return (...args) => {
        try {
            return callback(...args)
        } catch (_) {
            // Ignore the error
            return undefined
        }
    }
}