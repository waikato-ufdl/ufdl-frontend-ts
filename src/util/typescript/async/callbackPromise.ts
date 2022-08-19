import {rendezvous} from "./rendezvous";

export default function callbackPromise<
    CallbackParam,
    OtherParams extends readonly unknown[]
>(
    func: (callback: (param: CallbackParam) => void, ...other: OtherParams) => unknown,
    ignoreResult?: true,
    unpackSingleCallbackParam?: true
): (...other: OtherParams) => Promise<CallbackParam>;

export default function callbackPromise<
    CallbackParam,
    OtherParams extends readonly unknown[],
    Result
>(
    func: (callback: (param: CallbackParam) => void, ...other: OtherParams) => Result,
    ignoreResult: false,
    unpackSingleCallbackParam?: true
): (...other: OtherParams) => [Promise<CallbackParam>, Result];

export default function callbackPromise<
    CallbackParams extends readonly unknown[],
    OtherParams extends readonly unknown[]
>(
    func: (callback: (...params: CallbackParams) => void, ...other: OtherParams) => unknown,
    ignoreResult: true,
    unpackSingleCallbackParam: false
): (...other: OtherParams) => Promise<CallbackParams>;

export default function callbackPromise<
    CallbackParams extends readonly unknown[],
    OtherParams extends readonly unknown[],
    Result
>(
    func: (callback: (...params: CallbackParams) => void, ...other: OtherParams) => Result,
    ignoreResult: false,
    unpackSingleCallbackParam: false
): (...other: OtherParams) => [Promise<CallbackParams>, Result];

export default function callbackPromise(
    func: (callback: (...params: any) => void, ...other: any) => any,
    ignoreResult: boolean = true,
    unpackSingleCallbackParam: boolean = true
): (...other: any) => [Promise<any>, any] | Promise<any> {

    return (...other) => {
        const [promise, resolve] = rendezvous<any>()

        const result = func(
            (...args) => resolve(
                unpackSingleCallbackParam
                    ? args[0]
                    : args
            ),
            ...other
        )

        if (ignoreResult) return promise

        return [promise, result]
    }

}