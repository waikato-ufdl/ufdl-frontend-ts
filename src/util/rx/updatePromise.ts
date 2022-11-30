import {Observable, Subscriber, Subscription} from "rxjs";
import {rendezvous} from "../typescript/async/rendezvous";

/** Symbol indicating that the observable completed. */
export const COMPLETED = Symbol("The observable completed");

/** The type of value-update from the observable. */
export type NextUpdate<T> = {
    /** The value that the observable produced. */
    value: T,

    /** The promise of the next update. */
    next: Promise<Update<T>>
}

/** The type of an update from the observable. */
export type Update<T> = NextUpdate<T> | typeof COMPLETED

/**
 * A promise of the next update of an observable, and any possible following
 * update/s.
 *
 * @param observable
 *          The observable to monitor for updates.
 * @return
 *          A promise of the next update value of the observable, plus
 *          possible future updates.
 */
export default async function updatePromise<T>(
    observable: Observable<T>
): Promise<Update<T>> {
    // Create a rendezvous promise to receive the value
    let [promise, resolve, reject] = rendezvous<Update<T>>();
    let subscription: Subscription;

    // Create a subscriber which resolves/rejects the promise based
    // on how the subject terminates
    const subscriber: Subscriber<T> = new Subscriber(
        (next) => {
            const resolveCurrent = resolve;
            [promise, resolve, reject] = rendezvous<Update<T>>();
            resolveCurrent({value: next, next: promise});
        },
        (e) => reject(e),
        () => {
            resolve(COMPLETED);
            subscription.unsubscribe();
        }
    );

    // Subscribe the subscriber
    subscription = observable.subscribe(subscriber);

    return promise;
}
