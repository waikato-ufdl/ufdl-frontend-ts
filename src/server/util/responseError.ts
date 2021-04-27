import {PossiblePromise} from "../../util/typescript/types/promise";
import isPromise from "../../util/typescript/async/isPromise";

export async function formatResponseError(
    response: Response
): Promise<string> {
    // Parse the error body
    const body = await response.json();

    return Object.entries(body)
        .map((entry) => {
            const [key, value] = entry;
            return `${key}: ${value}`
        }).join("\n");
}

export const DEFAULT_HANDLED_ERROR_RESPONSE = Symbol("A response error occurred and was handled by default.");

export type WithDefaultHandledErrorResponse<R> = R | typeof DEFAULT_HANDLED_ERROR_RESPONSE

export async function alertOnError(
    response: Response
): Promise<typeof DEFAULT_HANDLED_ERROR_RESPONSE> {
    const formatted = await formatResponseError(response);
    window.alert(formatted);
    return DEFAULT_HANDLED_ERROR_RESPONSE;
}

export async function throwOnError(
    response: Response
): Promise<never> {
    const formatted = await formatResponseError(response);
    throw new Error(formatted);
}

export async function handleErrorResponse<R>(action: (() => Promise<R>) | Promise<R>): Promise<WithDefaultHandledErrorResponse<R>>;
export async function handleErrorResponse<R, E>(action: (() => Promise<R>) | Promise<R>, onError: (response: Response) => PossiblePromise<E>): Promise<R | E>;
export async function handleErrorResponse(
    action: (() => Promise<any>) | Promise<any>,
    onError: (response: Response) => PossiblePromise<any> = alertOnError
): Promise<any> {
    try {
        return await (isPromise(action) ? action : action());
    } catch (response) {
        // Rethrow any non-response errors
        if (!(response instanceof Response)) throw response;

        return onError(response);
    }
}

export type WithErrorResponseHandler<P extends readonly any[], R, E = typeof DEFAULT_HANDLED_ERROR_RESPONSE>
    = (...args: P) => Promise<R | E>

export function withErrorResponseHandler<P extends readonly any[], R>(
    action: (...args: P) => Promise<R>
): WithErrorResponseHandler<P, R>;
export function withErrorResponseHandler<P extends readonly any[], R, E>(
    action: (...args: P) => Promise<R>,
    onError: (response: Response) => PossiblePromise<E>
): WithErrorResponseHandler<P, R, E>;
export function withErrorResponseHandler(
    action: (...args: any) => any,
    onError: (response: Response) => PossiblePromise<any> = alertOnError
): (...args: any) => Promise<any> {
    return async (...args) => {
        return handleErrorResponse(
            () => action(...args),
            onError
        );
    }
}
