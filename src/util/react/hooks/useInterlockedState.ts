import {Dispatch, Reducer, useEffect, useReducer} from "react";
import useDerivedState from "./useDerivedState";

export type InterlockedStateUpdatePropAction<S> = {
    value: S | undefined
    propValueChanged: true
}

export type InterlockedStateUpdateStateAction<S> = {
    value: S
    propValueChanged: false
}

export type InterlockedStateUpdateAction<S> =
    | InterlockedStateUpdatePropAction<S>
    | InterlockedStateUpdateStateAction<S>

export type InterlockedState<S> = {
    value: S
    locked: boolean
}

export type InterlockedStateReducer<S> = Reducer<InterlockedState<S>, InterlockedStateUpdateAction<S>>

function interlockedStateReducer(
    prevState: InterlockedState<any>,
    action: InterlockedStateUpdateAction<any>
): InterlockedState<any> {
    let newState: InterlockedState<any>;

    if (action.propValueChanged) {
        newState = prevState;
        if (action.value === undefined) {
            newState.locked = false;
        } else {
            newState.value = action.value;
            newState.locked = true;
        }
    } else {
        if (prevState.locked) {
            newState = prevState;
        } else {
            newState = {
                value: action.value,
                locked: false
            }
        }
    }

    return newState;
}

function createInitialInterlockedState<S>(
    propValue: S | undefined,
    init: () => S
): InterlockedState<S> {
    if (propValue === undefined) {
        return {
            value: init(),
            locked: false
        }
    } else {
        return {
            value: propValue,
            locked: true
        }
    }
}

export function useInterlockedState<S>(
    propValue: S | undefined,
    init: () => S
): [S, Dispatch<S>, boolean] {
    const [reducerState, dispatch] = useReducer<InterlockedStateReducer<S>, null>(
        interlockedStateReducer,
        null,
        () => createInitialInterlockedState(propValue, init)
    );

    const locked = propValue !== undefined;

    const value = locked ?
        propValue as S :
        reducerState.value;

    useEffect(
        () => {
            dispatch(
                {
                    value: propValue,
                    propValueChanged: true
                }
            )
        },
        [propValue]
    );

    const setState = useDerivedState(
        () => (state: S) => dispatch({value: state, propValueChanged: false}),
        [dispatch]
    );

    return [value, setState, locked];
}
