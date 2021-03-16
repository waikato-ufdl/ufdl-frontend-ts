import {Dispatch, Reducer} from "react";
import useStateSafe from "./useStateSafe";

function createClosureReducer<S, A>(
    reducer: Reducer<S, A>,
    init: () => S
): [() => S, Dispatch<A>] {
    let state = init();

    function getState() {
        return state;
    }

    function dispatch(action: A) {
        state = reducer(state, action);
    }

    return [getState, dispatch];
}

export function useNonUpdatingReducer<S, A>(
    reducer: Reducer<S, A>,
    init: () => S
): [S, Dispatch<A>] {
    const [getState, dispatch] = useStateSafe(() => createClosureReducer(reducer, init))[0];

    return [getState(), dispatch];
}