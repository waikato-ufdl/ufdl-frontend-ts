import {BehaviorSubject, Observable} from "rxjs";
import behaviourSubjectFromSubscribable from "./behaviourSubjectFromSubscribable";

/**
 * Allows the promise of an Observable to be used as an Observable immediately.
 *
 * @param promise
 *          The promise of a future Observable.
 * @return
 *          An equivalent immediate Observable.
 */
export function immediateObservable<T>(
    promise: Promise<Observable<T>>
): Observable<T> {
    return new Observable<T>(
        (subscriber) => {
            promise.then(
                (value) => {
                    value.subscribe(subscriber);
                },
                subscriber.error
            )
        }
    )
}

/**
 * Allows the promise of a BehaviourSubject to be used as a BehaviourSubject immediately.
 *
 * @param promise
 *          The promise of a future BehaviourSubject.
 * @param initial
 *          The value that the BehaviourSubject takes before the promise is resolved.
 * @return
 *          An equivalent immediate BehaviourSubject.
 */
export function immediateBehaviourSubject<T, V>(
    promise: Promise<BehaviorSubject<T>>,
    initial: V
): BehaviorSubject<T | V> {
    return behaviourSubjectFromSubscribable<T | V>(immediateObservable(promise), initial);
}
