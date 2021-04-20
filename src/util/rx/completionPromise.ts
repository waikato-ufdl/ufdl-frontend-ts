import {BehaviorSubject} from "rxjs";
import {rendezvous} from "../typescript/async/rendezvous";
import onCompletion from "../typescript/async/onCompletion";

/**
 * A promise of the completion of a behaviour subject.
 *
 * @param subject
 *          The subject to monitor for completion.
 * @return
 *          A promise of the final value of the subject.
 */
export default async function completionPromise<T>(
    subject: BehaviorSubject<T>
): Promise<T> {
    // Create a rendezvous promise to receive the value
    const [promise, resolve, reject] = rendezvous<T>();

    // Subscribe the observer
    const subscription = subject.subscribe({
        error: (err) => { reject(err) },
        complete: () => resolve(subject.getValue())
    });

    // Once the promise resolves, the subscription is no longer required
    onCompletion(
        promise,
        () => subscription.unsubscribe()
    );

    return promise;
}
