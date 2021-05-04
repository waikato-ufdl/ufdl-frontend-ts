/**
 * Calls a handler for each promise as it resolves.
 *
 * @param promises
 *          The promises.
 * @param onFulfilled
 *          The action to take when a promise resolves successfully.
 * @param onRejected
 *          The action to take when a promise resolves unsuccessfully.
 * @return
 *          A void promise that resolves once all promises have resolved.
 */
export default async function asCompleting<T>(
    promises: Promise<T>[],
    onFulfilled: (value: T, index: number) => void,
    onRejected: (reason: any, index: number) => void
): Promise<void> {
    await Promise.all(
        promises.map(
            (promise, index) => {
                return promise.then(
                    (value) => onFulfilled(value, index),
                    (reason) => onRejected(reason, index)
                )
            }
        )
    )
}
