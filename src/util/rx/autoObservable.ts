import {Observable, TeardownLogic} from "rxjs";

/**
 * Automatically handles calling error/complete for an observable.
 *
 * @param subscribe
 *          The body of the observable.
 * @return
 *          The observable.
 */
export function autoObservable<T>(
    subscribe: (next: (x?: T) => void) => TeardownLogic
): Observable<T> {
    return new Observable<T>(
        (subscriber) => {
            let errored: boolean = false;

            try {
                return subscribe((x) => subscriber.next(x));
            } catch (e) {
                errored = true;
                subscriber.error(e);
            } finally {
                if (!errored) subscriber.complete();
            }
        }
    );
}