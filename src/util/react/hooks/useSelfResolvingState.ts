import {PossiblePromise} from "../../typescript/types/promise";
import {Dispatch, useEffect, useReducer} from "react";
import useDerivedState from "./useDerivedState";
import isPromise from "../../typescript/async/isPromise";

type SelfResolveAction<T> = {
    newState: PossiblePromise<T>,
    dispatch: Dispatch<SelfResolveAction<T>>
    resolving?: Promise<T>
}

type SelfResolvingStateReducer<T> = (
    currentState: PossiblePromise<T>,
    action: SelfResolveAction<T>
) => PossiblePromise<T>;

function addSelfResolver<T>(
    promise: Promise<T>,
    dispatch: Dispatch<SelfResolveAction<T>>,
): void {
    promise.then(
        (value) => dispatch(
            {
                newState: value,
                dispatch: dispatch,
                resolving: promise
            }
        )
    );
}

function selfResolvingStateReducer(
    currentState: PossiblePromise<any>,
    action: SelfResolveAction<any>
): PossiblePromise<any> {
    if (action.resolving === undefined || action.resolving === currentState) {
        return action.newState;
    }

    return currentState;
}

export default function useSelfResolvingState<T>(
    init: () => PossiblePromise<T>
): [PossiblePromise<T>, Dispatch<PossiblePromise<T>>] {

    const [state, dispatch] = useReducer<SelfResolvingStateReducer<T>, null>(
        selfResolvingStateReducer,
        null,
        init
    );

    useEffect(
        () => {
            if (isPromise(state)) {
                addSelfResolver(state, dispatch);
            }
        },
        [state, dispatch]
    );

    const selfResolvingDispatch = useDerivedState(
        ([dispatch]) => (value: PossiblePromise<T>) => {
            dispatch({newState: value, dispatch: dispatch})
        },
        [dispatch]
    );

    return [state, selfResolvingDispatch];
}
