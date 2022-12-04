import {Result} from "../result";
import promiseAsResult from "./promiseAsResult";

/**
 * Executes a handler against the result of a promise, whether successful
 * or not. Useful when the returned promise of a finally call is not needed
 * (doesn't leak uncaught exceptions, except those arising from handler
 * implementation).
 *
 * @param promise
 *          The promise to handle the result of.
 * @param handler
 *          The handler to execute.
 */
export default function onPromiseCompletion<T>(
    promise: Promise<T>,
    handler: (result: Result<T>) => void
): void {
    promiseAsResult(promise).then(handler);
}
