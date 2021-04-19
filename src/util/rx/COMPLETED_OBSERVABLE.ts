import {Observable} from "rxjs";

/** An observable that is already completed. */
export const COMPLETED_OBSERVABLE: Observable<never> = new Observable<never>(
    (subscriber) => {
        subscriber.complete();
    }
);
