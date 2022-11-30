import isPromise from "../../util/typescript/async/isPromise";
import {ErrorResponseHandler} from "./types/ErrorResponseHandler";
import {ERROR_RESPONSE_HANDLERS} from "./ERROR_RESPONSE_HANDLERS";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DEFAULT_HANDLED_ERROR_RESPONSE} from "./DEFAULT_HANDLED_ERROR_RESPONSE";

/**
 * Utility for handling error-responses from the server. The {@link UFDLServerContext} will
 * throw [Responses]{@link Response} that come back with an error status. This function catches those
 * responses and applies the default {@link ErrorResponseHandler} to them. The default handler is
 * to show an alert pop-up.
 *
 * @param action
 *          The function to call to initiate the request, or the promise of an
 *          in-flight request's response.
 * @return
 *          The result of the request, or the {@link DEFAULT_HANDLED_ERROR_RESPONSE} symbol
 *          if an error-response was received.
 */
export async function handleErrorResponse<R>(
    action: (() => Promise<R>) | Promise<R>
): Promise<R | typeof DEFAULT_HANDLED_ERROR_RESPONSE>;

/**
 * Utility for handling error-responses from the server. The {@link UFDLServerContext} will
 * throw [Responses]{@link Response} that come back with an error status. This function catches those
 * responses and applies the supplied {@link ErrorResponseHandler} to them.
 *
 * @param action
 *          The function to call to initiate the request, or the promise of an
 *          in-flight request's response.
 * @param onError
 *          The error-response handler to handle an error response if one occurs.
 * @return
 *          The result of the request, or the result of the error-response handler
 *          if it was invoked.
 */
export async function handleErrorResponse<R, E>(
    action: (() => Promise<R>) | Promise<R>,
    onError: ErrorResponseHandler<E>
): Promise<R | E>;

/**
 * Utility for handling error-responses from the server. The {@link UFDLServerContext} will
 * throw [Responses]{@link Response} that come back with an error status. This function catches those
 * responses and applies the supplied {@link ErrorResponseHandler} to them.
 *
 * @param action
 *          The function to call to initiate the request, or the promise of an
 *          in-flight request's response.
 * @param onError
 *          The error-response handler to handle an error response if one occurs.
 * @return
 *          The result of the request, or the result of the error-response handler
 *          if it was invoked.
 */
export async function handleErrorResponse(
    action: (() => Promise<any>) | Promise<any>,
    onError: ErrorResponseHandler<any> = ERROR_RESPONSE_HANDLERS.ALERT
): Promise<any> {
    try {
        if (isPromise(action))
            return await action
        else
            return await action()
    } catch (response) {
        // Rethrow any non-response errors
        if (!(response instanceof Response)) throw response;

        return onError(response);
    }
}