import {PossiblePromise} from "../../../util/typescript/types/promise";
import {DEFAULT_HANDLED_ERROR_RESPONSE} from "../DEFAULT_HANDLED_ERROR_RESPONSE";

/**
 * Function which handles an error response from a network call.
 *
 * @param response
 *          The error-response from the server.
 * @return
 *          A result from the handler.
 */
export type ErrorResponseHandler<E = typeof DEFAULT_HANDLED_ERROR_RESPONSE>
    = (response: Response) => PossiblePromise<E>
