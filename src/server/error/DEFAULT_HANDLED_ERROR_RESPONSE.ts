/**
 * Symbol which indicates that an error response was received from the server,
 * but was automatically handled.
 */
export const DEFAULT_HANDLED_ERROR_RESPONSE: unique symbol
    = Symbol("A response error occurred and was handled by default.");