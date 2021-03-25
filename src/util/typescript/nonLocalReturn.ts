import isPromise from "./async/isPromise";

/**
 * Helper class which carries the value of a non-local return call.
 */
class NonLocalReturnException<T> {
    constructor(readonly value: T) {}
}

/**
 * The type of the function called to enact a non-local return.
 */
type NonLocalReturnFunction<T> = void extends T ? (() => never) : ((value: T) => never)

/**
 * Handles the catch block for a non-local return exception.
 *
 * @param e
 *          The exception.
 */
function handleCatchNonLocalReturn<T>(
    e: any
): T {
    // If a non-local return was executed, return the value
    if (e instanceof NonLocalReturnException) return e.value;

    // Rethrow on any other exception
    throw e;
}

/**
 * Allows a function to return a value immediately from a non-local context.
 *
 * @param body
 *          The body of the function to call, which is passed a function to
 *          cause a non-local return to occur.
 * @return
 *          The value passed to the non-local return call, or the result
 *          of the function if it completes normally.
 */
export function withNonLocalReturn<T = void>(
    body: (nonLocalReturn: NonLocalReturnFunction<T>) => T
): T {
    // Define the non-local return function
    const nonLocalReturn = (
        (value) => {throw new NonLocalReturnException(value)}
    ) as NonLocalReturnFunction<T>;

    try {
        // Execute the body of the function with the non-local return context
        let result = body(nonLocalReturn);

        // If the body is asynchronous, attach a catch handler
        if (isPromise(result)) result = result.catch(handleCatchNonLocalReturn) as any;

        return result;

    } catch (e) {
        return handleCatchNonLocalReturn<T>(e);
    }
}
