import {rendezvous} from "./typescript/async/rendezvous";
import isDefined from "./typescript/isDefined";
import isFunction from "./typescript/types/predicates/isFunction";

type LoadingElement<
    ErrorHandler extends (...args: any) => any = (...args: any) => any,
    OnLoadKey extends PropertyKey = "onload",
    OnErrorKey extends PropertyKey = "onerror"
> = { [key in OnLoadKey]: ((...args: any) => any) | null | undefined } & { [key in OnErrorKey]: ErrorHandler | null | undefined }

export default function loadedAwaitable(
    element: LoadingElement
): Promise<void>

export default function loadedAwaitable<
    OnLoadKey extends PropertyKey
>(
    element: LoadingElement<(...args: any) => any, OnLoadKey>,
    loadKey: OnLoadKey
): Promise<void>

export default function loadedAwaitable<
    OnLoadKey extends PropertyKey,
    OnErrorKey extends PropertyKey
>(
    element: LoadingElement<(...args: any) => any, OnLoadKey, OnErrorKey>,
    loadKey: OnLoadKey,
    errorKey: OnErrorKey
): Promise<void>

export default function loadedAwaitable<
    ErrorHandler extends (...args: any) => any
>(
    element: LoadingElement<ErrorHandler>,
    formatError: (...args: Parameters<ErrorHandler>) => any
): Promise<void>

export default function loadedAwaitable<
    ErrorHandler extends (...args: any) => any,
    OnLoadKey extends PropertyKey
>(
    element: LoadingElement<ErrorHandler, OnLoadKey>,
    formatError: (...args: Parameters<ErrorHandler>) => any,
    loadKey: OnLoadKey
): Promise<void>

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

export default function loadedAwaitable(
    element: any,
    formatError: ((...args: any) => any) | PropertyKey | undefined = undefined,
    loadKey: PropertyKey | undefined = undefined,
    errorKey: PropertyKey | undefined = undefined
): Promise<void> {

    let formatErrorActual: (...args: any) => any
    if (!isFunction(formatError)) {
        errorKey = loadKey
        loadKey = formatError
        formatErrorActual = (...args: any) => args
    } else {
        formatErrorActual = formatError
    }

    if (!isDefined(loadKey)) loadKey = "onload"
    if (!isDefined(errorKey)) errorKey = "onerror"

    // Create a rendezvous to resolve the stats once the image loads
    const [promise, resolve, reject] = rendezvous<void>()

    const currentLoad = element[loadKey]
    const currentError = element[errorKey]

    element[loadKey] = (...args: any) => {
        resolve()
        if (isFunction(currentLoad)) currentLoad(...args)
    }

    element[errorKey] = (...args: any) => {
        if (isFunction(currentError)) currentError(...args)
        reject(formatErrorActual(...args))
    }

    return promise
}
