import {Dispatch, useEffect} from "react";
import useDerivedState from "./useDerivedState";
import useControlledUpdateReducer from "./useControlledUpdateReducer";

export const UNCONTROLLED_KEEP = Symbol(
    "Indicates that the component should manage the state for this prop, " +
    "but keep the last controlled state until another state change is made."
);

export const UNCONTROLLED_RESET = Symbol(
    "Indicates that the component should manage the state for this prop, " +
    "and reset it to its initial value."
);

export type Controllable<S> = S | typeof UNCONTROLLED_KEEP | typeof UNCONTROLLED_RESET;

export function isControlled<S>(
    value: Controllable<S>
): value is S {
    return value !== UNCONTROLLED_KEEP && value !== UNCONTROLLED_RESET;
}

export type ControllableReducerState<S> = {
    controlled: boolean
    value: S
}

export type UpdateControlValueAction<S> = {
    isControl: true
    controlled: boolean
    value: S
}

export type UpdateStateValueAction<S> = {
    isControl: false
    value: S
}

export type ControllableReducerAction<S> =
    | UpdateControlValueAction<S>
    | UpdateStateValueAction<S>

function controllableStateReducer(
    prevState: ControllableReducerState<any>,
    action: ControllableReducerAction<any>
): ControllableReducerState<any> {
    console.log(prevState, action);
    if (action.isControl) {
        return {
            controlled: action.controlled,
            value: action.value
        };
    } else {
        if (prevState.controlled) return prevState;
        return {
            controlled: false,
            value: action.value
        }
    }
}

function createInitialControllableReducerState<S>(
    controlValue: Controllable<S>,
    init: () => S
): ControllableReducerState<S> {
    if (isControlled(controlValue)) {
        return {
            value: controlValue,
            controlled: true
        }
    } else {
        return {
            value: init(),
            controlled: false
        }
    }
}

export function useControllableState<S>(
    controlValue: Controllable<S>,
    init: () => S
): [S, Dispatch<S>, boolean] {
    const [reducerState, dispatch] = useControlledUpdateReducer<ControllableReducerState<S>, ControllableReducerAction<S>>(
        controllableStateReducer,
        () => createInitialControllableReducerState(controlValue, init)
    );

    const controlled = isControlled(controlValue);

    const initValue = useDerivedState(
        () => controlValue === UNCONTROLLED_RESET ? init() : reducerState.value,
        [controlValue]
    );

    const value = controlValue === UNCONTROLLED_RESET ? initValue : controlValue === UNCONTROLLED_KEEP ? reducerState.value : controlValue as S;

    useEffect(
        () => {
            dispatch({isControl: true, controlled: controlled, value: value}, false)
        },
        [dispatch, controlled, value]
    );

    const setState = useDerivedState(
        () => (state: S) => dispatch({isControl: false, value: state}, true),
        [dispatch]
    );

    return [value, setState, controlled];
}
