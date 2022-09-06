import {Observable, Observer} from "rxjs";
import {Reducer, useEffect} from "react";
import useDerivedReducer from "./useDerivedReducer";
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

function observableReducer<T>(
    state: ObservableState<T> | undefined,
    action: ObservableState<T>
): ObservableState<T> {
    if (
        (state !== undefined)
        &&
        (
            (state.type === "next" && action.type === "next" && state.value === action.value)
            ||
            (state.type === "complete" && action.type === "complete")
            ||
            (state.type === "error" && action.type === "error" && state.err === action.err)
        )
    ) {
        return state
    }

    return action
}

function getObservableReducer<T>(): Reducer<ObservableState<T> | undefined, ObservableState<T>> {
    return observableReducer
}

export function useObservable<T>(
    subject?: Observable<T>
): ObservableState<T> | undefined {

    const [state, dispatch] = useDerivedReducer(
        getObservableReducer<T>(),
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
