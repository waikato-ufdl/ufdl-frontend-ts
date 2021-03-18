import {BehaviorSubject, Subscriber} from "rxjs";
import {rendezvous} from "../typescript/async/rendezvous";
import {discard} from "../typescript/discard";

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

    // Create a subscriber which resolves/rejects the promise based
    // on how the subject terminates
    const subscriber: Subscriber<T> = Subscriber.create(
        undefined,
        (e) => reject(e),
        () => resolve(subject.getValue())
    );

    // Subscribe the subscriber
    const subscription = subject.subscribe(subscriber);

    // Once the promise resolves, the subscription is no longer required
    discard(promise.finally(() => subscription.unsubscribe()));

    return promise;
}
