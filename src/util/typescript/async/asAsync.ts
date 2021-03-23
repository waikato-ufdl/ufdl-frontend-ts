import {Async} from "../types/Async";

/**
 * Converts a synchronous function into an asynchronous one.
 *
 * @param body
 *          The function to convert.
 * @return
 *          The asynchronous equivalent.
 */
export default function asAsync<F extends (...args: any) => any>(
    body: F
): Async<F> {
    return async function(...args: any) {
        return body(...args)
    } as Async<F>;
}
