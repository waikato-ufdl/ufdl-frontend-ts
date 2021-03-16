import {Observable, Observer} from "rxjs";
import {useEffect} from "react";
import useDerivedReducer from "./useDerivedReducer";
import {createSimpleStateReducer} from "./SimpleStateReducer";
import {constantInitialiser} from "../../typescript/initialisers";

export type ObservableNextState<T> = {
    type: "next"
    value: T
}

export type ObservableCompleteState = {
    type: "complete"
}

export type ObservableErrorState = {
    type: "error"
    err: any
}

export type ObservableState<T> =
    | ObservableNextState<T>
    | ObservableCompleteState
    | ObservableErrorState

export function useObservable<T>(
    subject?: Observable<T>
): ObservableState<T> | undefined {

    const [state, dispatch] = useDerivedReducer(
        createSimpleStateReducer<ObservableState<T> | undefined>(),
        constantInitialiser(undefined),
        [subject]
    );

    useEffect(
        () => {
            if (subject === undefined) return;

            const observer: Observer<T> = {
                next(value) { dispatch({ type: "next", value: value }) },
                complete() { dispatch({ type: "complete" }) },
                error(err) { dispatch({ type: "error", err: err }) }
            };

            const subscription = subject.subscribe(observer);

            return () => {
                subscription.unsubscribe()
            }
        },
        [subject, dispatch]
    );

    return state;
}
