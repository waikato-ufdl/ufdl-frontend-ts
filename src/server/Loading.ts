import {BehaviorSubject, Observable, Subscription} from "rxjs"
import behaviourSubjectOperatorFunction from "../util/rx/behaviourSubjectOperatorFunction";
import {map} from "rxjs/operators";
import {memo} from "../util/memo";
import sync, {UNAVAILABLE} from "../util/typescript/async/sync";
import behaviourSubjectCompletionPromise from "../util/rx/behaviourSubjectCompletionPromise";

/**
 * Abstraction over data that may be delivered synchronously, asynchronously
 * (via {@link Promise}), or streamed (via a {@link BehaviorSubject}).
 */
export class Loading<T> {

    private constructor(
        private readonly getValue: () => T,
        private readonly getPromise: () => Promise<T>,
        private readonly getObservable: () => Observable<T>,
        private readonly getIsFinished: () => boolean,
        public readonly mode: "sync" | "async" | "streamed"
    ) {
    }

    get value(): T {
        return this.getValue()
    }

    get promise(): Promise<T> {
        return this.getPromise()
    }

    get observable(): Observable<T> {
        return this.getObservable()
    }

    get isFinished(): boolean {
        return this.getIsFinished()
    }

    static fromLoaded<T>(value: T): Loading<T> {
        return new Loading(
            () => value,
            memo(() => Promise.resolve(value)),
            memo(() => {
                const behaviourSubject = new BehaviorSubject(value)
                behaviourSubject.complete()
                return behaviourSubject
            }),
            () => true,
            "sync"
        )
    }

    static fromPromise<T>(value: Promise<T>, placeholder: T): Loading<T> {
        // Call sync immediately so the result is ready as soon as possible
        sync(value)

        return new Loading<T>(
            () => {
                const resolved = sync(value, true)
                if (resolved !== UNAVAILABLE) return resolved
                return placeholder
            },
            () => value,
            memo(() => {
                const behaviourSubject = new BehaviorSubject<T>(placeholder)
                const result = sync(value)
                if (result === UNAVAILABLE) {
                    value.then(
                        result => {
                            behaviourSubject!.next(result)
                            behaviourSubject!.complete()
                        }
                    )
                } else if (result.success) {
                    behaviourSubject.next(result.value)
                    behaviourSubject.complete()
                } else {
                    behaviourSubject.error(result.error)
                }
                return behaviourSubject
            }),
            () => sync(value) !== UNAVAILABLE,
            "async"
        )
    }

    static fromBehaviourSubject<T>(value: BehaviorSubject<T>): Loading<T> {
        let isFinished = false

        let subscription: Subscription | undefined = undefined
        subscription = value.subscribe(
            {
                complete: () => {
                    isFinished = true
                    subscription?.unsubscribe()
                }
            }
        )
        if (isFinished) subscription.unsubscribe()

        return new Loading(
            () => value.getValue(),
            memo(() => behaviourSubjectCompletionPromise(value)),
            () => value,
            () => isFinished,
            "streamed"
        )
    }

    map<R>(
        f: (value: T) => R
    ): Loading<R> {
        return new Loading(
            () => f(this.getValue()),
            memo(() => this.getPromise().then(value => f(value))),
            memo(() => behaviourSubjectOperatorFunction(map(f))(this.getObservable() as BehaviorSubject<T>)),
            this.getIsFinished,
            this.mode
        )
    }
}
