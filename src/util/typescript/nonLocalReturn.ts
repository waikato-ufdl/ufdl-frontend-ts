/**
 * Helper class which carries the value of a non-local return call.
 */
class NonLocalReturnException<T> {
    constructor(readonly value: T) {}
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
export function withNonLocalReturn<T>(
    body: (nonLocalReturn: (value: T) => never) => T
): T {
    // Define the non-local return function
    function nonLocalReturn(value: T): never {
        throw new NonLocalReturnException(value);
    }

    try {
        // Execute the body of the function with the non-local return context
        return body(nonLocalReturn);

    } catch (e) {
        // If a non-local return was executed, return the value
        if (e instanceof NonLocalReturnException) return e.value;

        // Rethrow on any other exception
        throw e;
    }
}
