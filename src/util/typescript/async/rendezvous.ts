export type ResolveValue<T> = PromiseLike<T> | T
export type ResolveFunction<T> = (value: ResolveValue<T>) => void;
export type RejectFunction = (reason?: any) => void;

export function rendezvous<T>(): [Promise<T>, ResolveFunction<T>, RejectFunction] {
    let outcome: boolean | undefined = undefined;
    let resolveValue: ResolveValue<T> | undefined = undefined;
    let rejectReason: any = undefined;
    let resolve: ResolveFunction<T> | undefined = undefined;
    let reject: RejectFunction | undefined = undefined;

    const promise: Promise<T> = new Promise(
        (resolve1: ResolveFunction<T>, reject1: RejectFunction) => {
            if (outcome === true) {
                resolve1(resolveValue as ResolveValue<T>);
            } else if (outcome === false) {
                reject1(rejectReason);
            } else {
                resolve = resolve1;
                reject = reject1;
            }
        }
    );

    return [
        promise,
        (value) => {
            if (resolve === undefined) {
                outcome = true;
                resolveValue = value;
            } else {
                resolve(value);
            }
        },
        (reason) => {
            if (reject === undefined) {
                outcome = false;
                rejectReason = reason;
            } else {
                reject(reason);
            }
        }
    ]
}