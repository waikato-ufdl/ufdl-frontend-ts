import {BehaviorSubject, Subscriber} from "rxjs";
import {rendezvous} from "../typescript/async/rendezvous";

export default async function completionPromise<T>(
    subject: BehaviorSubject<T>
): Promise<T> {
    const [promise, resolve, reject] = rendezvous<T>();

    const subscriber: Subscriber<T> = Subscriber.create(
        undefined,
        (e) => reject(e),
        () => resolve(subject.getValue())
    );

    const subscription = subject.subscribe(subscriber);

    promise.then(() => subscription.unsubscribe());

    return promise;
}
