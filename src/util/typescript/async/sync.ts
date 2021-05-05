import doAsync from "./doAsync";
import {Result} from "../result";
import promiseAsResult from "./promiseAsResult";

/** Placeholder symbol for promises which haven't resolved. */
export const UNAVAILABLE = Symbol("The promise has not yet resolved.")

/** Holds the values of promises once they have been resolved. */
const RESOLVED_VALUES: WeakMap<Promise<any>, Result<any> | typeof UNAVAILABLE> = new WeakMap();

/**
 * Gets the value of a promise synchronously if it is available.
 *
 * @param promise
 *          The promise to synchronously resolve.
 * @return
 *          - [UNAVAILABLE] if the promise has not yet resolved.
 *          - The promise's resolved value if it resolved successfully.
 * @throws
 *          Any error that the promise rejects with.
 */
export default function sync<T>(
    promise: Promise<T>
): T | typeof UNAVAILABLE {
    // Get the value cached against the promise
    const current = RESOLVED_VALUES.get(promise);

    // If it is the placeholder value, we've already seen this promise,
    // but it has not resolved
    if (current === UNAVAILABLE) return UNAVAILABLE;

    // If it's otherwise in the cache, it is the resolved/rejected value.
    // Return/rethrow accordingly
    if (current !== undefined) {
        if (current.success)
            return current.value
        else
            throw current.error
    }

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

    return UNAVAILABLE;
}
