import {ErrorResponseHandler} from "./types/ErrorResponseHandler";
import {formatResponseError} from "./formatResponseError";
import {DEFAULT_HANDLED_ERROR_RESPONSE} from "./DEFAULT_HANDLED_ERROR_RESPONSE";

/**
 * Collection of built-in error response handlers.
 *
 * @property ALERT
 *          Shows the response error in an [alert pop-up]{@link Window.alert}.
 * @property THROW
 *          Throws the body of the response as an {@link Error}.
 * @property CONSOLE_ERROR
 *          Prints the error to the {@link console}.
 */
export const ERROR_RESPONSE_HANDLERS = {
    // FIXME: Typescript infers 'symbol' instead of 'typeof DEFAULT_HANDLED_ERROR_RESPONSE', so we specify explicitly
    //        Hopefully the Typescript team will fix this in future
    ALERT: async function(response): Promise<typeof DEFAULT_HANDLED_ERROR_RESPONSE> {
        const formatted = await formatResponseError(response);
        window.alert(formatted);
        return DEFAULT_HANDLED_ERROR_RESPONSE
    },
    THROW: async (response) => {
        const formatted = await formatResponseError(response);
        throw new Error(formatted);
    },
    // FIXME: Typescript infers 'symbol' instead of 'typeof DEFAULT_HANDLED_ERROR_RESPONSE', so we specify explicitly
    //        Hopefully the Typescript team will fix this in future
    CONSOLE_ERROR: async function(response): Promise<typeof DEFAULT_HANDLED_ERROR_RESPONSE> {
        const formatted = await formatResponseError(response);
        console.error(formatted);
        return DEFAULT_HANDLED_ERROR_RESPONSE
    }
} satisfies {
    [handler: string]: ErrorResponseHandler<unknown>
}
