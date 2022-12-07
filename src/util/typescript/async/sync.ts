import doAsync from "./doAsync";
import {inlineResult, Result} from "../result";
import promiseAsResult from "./promiseAsResult";

/** Placeholder symbol for promises which haven't resolved. */
export const UNAVAILABLE = Symbol("The promise has not yet resolved.")

/** Holds the values of promises once they have been resolved. */
const RESOLVED_VALUES: WeakMap<Promise<unknown>, Result<unknown> | typeof UNAVAILABLE> = new WeakMap();

/**
 * Gets the value of a promise synchronously if it is available.
 *
 * @param promise
 *          The promise to synchronously resolve.
 * @param inline
 *          Whether to inline the result.
 * @return
 *          - {@link UNAVAILABLE} if the promise has not yet resolved.
 *          - The promise's [result]{@link Result} if it has resolved.
 */
export default function sync<T>(
    promise: Promise<T>,
    inline?: false
): Result<T> | typeof UNAVAILABLE

/**
 * Gets the value of a promise synchronously if it is available.
 *
 * @param promise
 *          The promise to synchronously resolve.
 * @param inline
 *          Whether to inline the result.
 * @return
 *          - {@link UNAVAILABLE} if the promise has not yet resolved.
 *          - The promise's resolved value if it resolved successfully.
 * @throws
 *          Any error that the promise rejects with.
 */
export default function sync<T>(
    promise: Promise<T>,
    inline: true
): T | typeof UNAVAILABLE;

/**
 * Gets the value of a promise synchronously if it is available.
 *
 * @param promise
 *          The promise to synchronously resolve.
 * @param inline
 *          Whether to inline the result.
 * @return
 *          - {@link UNAVAILABLE} if the promise has not yet resolved.
 *          - The promise's resolved value if it resolved successfully.
 * @throws
 *          Any error that the promise rejects with.
 */
export default function sync<T>(
    promise: Promise<T>,
    inline?: boolean
): Result<T> | T | typeof UNAVAILABLE {
    // If we haven't seen this promise before, put it in the cache for resolution
    if (!RESOLVED_VALUES.has(promise)) {
        // Put the placeholder in the cache
        RESOLVED_VALUES.set(promise, UNAVAILABLE);

        // Add a task to cache the result once it is available
        doAsync(
            async () => {
                RESOLVED_VALUES.set(
                    promise,
                    await promiseAsResult(promise)
                )
            }
        )

        // First time we've seen the promise, so the result is unavailable
        return UNAVAILABLE;
    }

    // Get the value cached against the promise
    const current = RESOLVED_VALUES.get(promise) as Result<T> | typeof UNAVAILABLE

    // If it is the placeholder value, we've already seen this promise,
    // but it has not resolved
    if (current === UNAVAILABLE) return UNAVAILABLE;

    // Return or throw based on the promise's result
    return inline === true ? inlineResult(current) : current
}
