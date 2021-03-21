/**
 * Returns the result of the first promise to complete successfully. If all
 * promises fail, this returned promise will fail with an array of the reasons
 * for each respective promise.
 *
 * @param promises
 *          A list of promises.
 * @return
 *          A promise of the value of the first promise to return.
 */
import {rendezvous} from "./rendezvous";

export default async function first<T>(
    ...promises: Promise<T>[]
): Promise<T> {
    // Create a rendezvous promise for the result
    const [result, resolve, reject] = rendezvous<T>();

    // Create a closure for tracking the winner + any errors
    let resolved = false;
    let errors = Array<any>(promises.length);
    let numRejected = 0;

    // Make sure only the first result calls resolve
    function resolveOnce(value: T) {
        if (!resolved) {
            resolve(value);
            resolved = true;
        }
    }

    // Make sure all errors are caught, and reject is called only once
    // if all promises fail
    function rejectOnce(reason: any, index: number) {
        errors[index] = reason;
        numRejected++;
        if (numRejected === promises.length) reject(errors);
    }

    // Set each promise to use
    promises.forEach(
        (promise, index) => {
            promise
                .then(resolveOnce)
                .catch((reason) => rejectOnce(reason, index));
        }
    );

    return result;
}