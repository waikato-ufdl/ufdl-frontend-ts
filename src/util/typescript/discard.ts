/**
 * Discards any arguments given.
 */
export function discard(
    ..._args: any
): void {
    // Does nothing with the argument
}

/**
 * Returns a promise that completes when the given promise
 * does, but yields no value.
 *
 * @param promise
 *          The promise whose value should be discarded.
 * @return
 *          An equivalent promise with no value.
 */
export function discardPromise(
    promise: Promise<any>
): Promise<void> {
    return promise.then((value) => discard(value));
}
