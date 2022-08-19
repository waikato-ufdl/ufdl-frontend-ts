import oneShot from "../functions/oneShot";

export type ResolveValue<T> = PromiseLike<T> | T
export type ResolveFunction<T> = (value: ResolveValue<T>) => void;
export type RejectFunction = (reason?: any) => void;

/**
 * Tool for externalising the resolve/reject functions of a promise, so that
 * they can separately be passed to the producer and consumer of the future value.
 *
 * @return
 *          A promise, and the functions to resolve/reject it. The functions will
 *          ignore any calls subsequent to the first.
 */
export function rendezvous<T>(): [Promise<T>, ResolveFunction<T>, RejectFunction] {
    // Whether the promise resolved (true), rejected (false) or is still pending (undefined)
    let outcome: boolean | undefined = undefined;

    // The resolved value if `outcome` is true, the rejection reason if `outcome` is false, otherwise undefined
    let result: any = undefined;

    // The externalised resolve/reject functions of the promise, or undefined if externalisation is pending
    let resolve: ResolveFunction<T> | undefined = undefined;
    let reject: RejectFunction | undefined = undefined;

    const promiseExecutor = (resolve1: ResolveFunction<T>, reject1: RejectFunction) => {
        if (outcome === true) {
            // If the resolve dispatch has already been called, resolve the promise immediately
            resolve1(result as ResolveValue<T>);
        } else if (outcome === false) {
            // If the reject dispatch has already been called, reject the promise immediately
            reject1(result);
        } else {
            // Otherwise externalise the callbacks
            resolve = resolve1;
            reject = reject1;
        }
    }

    const promise: Promise<T> = new Promise(oneShot(promiseExecutor));

    const resolveFunction: ResolveFunction<T> = (value) => {
        if (resolve === undefined) {
            // If resolve was called before externalisation, cache the result
            outcome = true;
            result = value;
        } else {
            // Otherwise resolve the promise
            resolve(value);
        }
    }

    const rejectFunction: RejectFunction = (reason) => {
        if (reject === undefined) {
            // If resolve was called before externalisation, cache the reason
            outcome = false;
            result = reason;
        } else {
            reject(reason);
        }
    }

    return [promise, oneShot(resolveFunction), oneShot(rejectFunction)]
}