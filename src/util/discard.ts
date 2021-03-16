export function discard(_: any): void {
    // Does nothing with the argument
}

export function discardPromise(promise: Promise<any>): Promise<void> {
    return promise.then((value) => discard(value));
}
