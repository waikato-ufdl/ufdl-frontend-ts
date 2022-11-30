import {PossiblePromise} from "../../util/typescript/types/promise";
import {handleErrorResponse} from "./handleErrorResponse";
import {WithErrorResponseHandler} from "./types/WithErrorResponseHandler";
import {ErrorResponseHandler} from "./types/ErrorResponseHandler";
import {ERROR_RESPONSE_HANDLERS} from "./ERROR_RESPONSE_HANDLERS";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";

/**
 * Attaches the default error-response handler to a function which makes network calls
 * via the {@link UFDLServerContext}. When the modified function is called,
 * if the response is an error-response, it will be handled automatically by
 * the default handler. See {@link handleErrorResponse}.
 *
 * @param action
 *          The function which may throw an error-response.
 * @return
 *          The modified function.
 */
export function withErrorResponseHandler<P extends readonly any[], R>(
    action: (...args: P) => Promise<R>
): WithErrorResponseHandler<P, R>;

/**
 * Attaches an error-response handler to a function which makes network calls
 * via the {@link UFDLServerContext}. When the modified function is called,
 * if the response is an error-response, it will be handled automatically by
 * the provided handler. See {@link handleErrorResponse}.
 *
 * @param action
 *          The function which may throw an error-response.
 * @param onError
 *          The error-response handler.
 * @return
 *          The modified function.
 */
export function withErrorResponseHandler<P extends readonly any[], R, E>(
    action: (...args: P) => Promise<R>,
    onError: (response: Response) => PossiblePromise<E>
): WithErrorResponseHandler<P, R, E>;

/**
 * Attaches an error-response handler to a function which makes network calls
 * via the {@link UFDLServerContext}. When the modified function is called,
 * if the response is an error-response, it will be handled automatically by
 * the provided handler. See {@link handleErrorResponse}.
 *
 * @param action
 *          The function which may throw an error-response.
 * @param onError
 *          The error-response handler.
 * @return
 *          The modified function.
 */
export function withErrorResponseHandler(
    action: (...args: any) => any,
    onError: ErrorResponseHandler<any> = ERROR_RESPONSE_HANDLERS.ALERT
): (...args: any) => Promise<any> {
    return async (...args) => {
        return handleErrorResponse(
            () => action(...args),
            onError
        );
    }
}