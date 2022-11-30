import {DEFAULT_HANDLED_ERROR_RESPONSE} from "../DEFAULT_HANDLED_ERROR_RESPONSE";

/**
 * The type of function which has automatic error-response handling.
 */
export type WithErrorResponseHandler<
    P extends readonly unknown[],
    R,
    E = typeof DEFAULT_HANDLED_ERROR_RESPONSE
>
    = (...args: P) => Promise<R | E>