import {rendezvous} from "./typescript/async/rendezvous";
import isDefined from "./typescript/isDefined";
import isFunction from "./typescript/types/predicates/isFunction";

/**
 * The type of loading HTML element that can be awaited by loadedAwaitable.
 */
type LoadingElement<
    ErrorHandler extends (...args: any) => any = (...args: any) => any,
    OnLoadKey extends PropertyKey = "onload",
    OnErrorKey extends PropertyKey = "onerror"
> = { [key in OnLoadKey]: ((...args: any) => any) | null | undefined } & { [key in OnErrorKey]: ErrorHandler | null | undefined }

/**
 * Function which returns a promise that resolves/rejects once an HTML element
 * loads/errors.
 *
 * @param element
 *          The element to await.
 */
export default function loadedAwaitable(
    element: LoadingElement
): Promise<void>

/**
 * Function which returns a promise that resolves/rejects once an HTML element
 * loads/errors.
 *
 * @param element
 *          The element to await.
 * @param loadKey
 *          The property key for the load event callback.
 */
export default function loadedAwaitable<
    OnLoadKey extends PropertyKey
>(
    element: LoadingElement<(...args: any) => any, OnLoadKey>,
    loadKey: OnLoadKey
): Promise<void>

/**
 * Function which returns a promise that resolves/rejects once an HTML element
 * loads/errors.
 *
 * @param element
 *          The element to await.
 * @param loadKey
 *          The property key for the load event callback.
 * @param errorKey
 *          The property key for the error event callback.
 */
export default function loadedAwaitable<
    OnLoadKey extends PropertyKey,
    OnErrorKey extends PropertyKey
>(
    element: LoadingElement<(...args: any) => any, OnLoadKey, OnErrorKey>,
    loadKey: OnLoadKey,
    errorKey: OnErrorKey
): Promise<void>

/**
 * Function which returns a promise that resolves/rejects once an HTML element
 * loads/errors.
 *
 * @param element
 *          The element to await.
 * @param formatError
 *          Function which turns the arguments to the error event handler
 *          into the value used to reject the promise.
 */
export default function loadedAwaitable<
    ErrorHandler extends (...args: any) => any
>(
    element: LoadingElement<ErrorHandler>,
    formatError: (...args: Parameters<ErrorHandler>) => any
): Promise<void>

/**
 * Function which returns a promise that resolves/rejects once an HTML element
 * loads/errors.
 *
 * @param element
 *          The element to await.
 * @param formatError
 *          Function which turns the arguments to the error event handler
 *          into the value used to reject the promise.
 * @param loadKey
 *          The property key for the load event callback.
 */
export default function loadedAwaitable<
    ErrorHandler extends (...args: any) => any,
    OnLoadKey extends PropertyKey
>(
    element: LoadingElement<ErrorHandler, OnLoadKey>,
    formatError: (...args: Parameters<ErrorHandler>) => any,
    loadKey: OnLoadKey
): Promise<void>

/**
 * Function which returns a promise that resolves/rejects once an HTML element
 * loads/errors.
 *
 * @param element
 *          The element to await.
 * @param formatError
 *          Function which turns the arguments to the error event handler
 *          into the value used to reject the promise.
 * @param loadKey
 *          The property key for the load event callback.
 * @param errorKey
 *          The property key for the error event callback.
 */
export default function loadedAwaitable<
    ErrorHandler extends (...args: any) => any,
    OnLoadKey extends PropertyKey,
    OnErrorKey extends PropertyKey
>(
    element: LoadingElement<ErrorHandler, OnLoadKey>,
    formatError: (...args: Parameters<ErrorHandler>) => any,
    loadKey: OnLoadKey,
    errorKey: OnErrorKey
): Promise<void>

/**
 * Function which returns a promise that resolves/rejects once an HTML element
 * loads/errors.
 *
 * @param element
 *          The element to await.
 * @param formatError
 *          Function which turns the arguments to the error event handler
 *          into the value used to reject the promise. As this function is
 *          overloaded, if this is not a function, it is actually the
 *          loadKey parameter (see below).
 * @param loadKey
 *          The property key for the load event callback. As this function is
 *          overloaded, if formatError is not a function, it is actually the
 *          loadKey parameter, and this parameter is the errorKey parameter
 *          (see below).
 * @param errorKey
 *          The property key for the error event callback.
 */
export default function loadedAwaitable(
    element: any,
    formatError: ((...args: any) => any) | PropertyKey | undefined = undefined,
    loadKey: PropertyKey | undefined = undefined,
    errorKey: PropertyKey | undefined = undefined
): Promise<void> {

    // Handle the possible rotation of arguments due to function overloads
    let formatErrorActual: (...args: any) => any
    if (!isFunction(formatError)) {
        // An overload without formatError was used, so formatError is actaully
        // loadKey, and loadKay is actually errorKey
        errorKey = loadKey
        loadKey = formatError

        // No error argument formatting is done (other than collection)
        formatErrorActual = (...args: any) => args
    } else {
        // An overload with formatError was used, so the parameters are correctly
        // assigned
        formatErrorActual = formatError
    }

    // Handle the defaults for undefined load/error event keys
    if (!isDefined(loadKey)) loadKey = "onload"
    if (!isDefined(errorKey)) errorKey = "onerror"

    // Create a rendezvous promise to act as the event handlers for the
    // load and error events
    const [promise, resolve, reject] = rendezvous<void>()

    // Save the current event handlers, so they still get called
    const currentLoad = element[loadKey]
    const currentError = element[errorKey]

    // Add new event handlers which both call the old handler, and
    // resolve/reject the promise
    element[loadKey] = (...args: any) => {
        resolve()
        if (isFunction(currentLoad)) currentLoad(...args)
    }
    element[errorKey] = (...args: any) => {
        // Formatting the arguments may throw, so reject the promise with that
        // error if it occurs
        try {
            reject(formatErrorActual(...args))
        } catch (e) {
            reject(new FormatErrorThrewError(args, e))
        }
        if (isFunction(currentError)) currentError(...args)
    }

    return promise
}

class FormatErrorThrewError extends Error {
    constructor(
        readonly formatArgs: any,
        readonly formatError: any
    ) {
        super("loadedAwaitable threw on formatError");
    }
}