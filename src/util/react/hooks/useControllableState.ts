import {Dispatch, useEffect} from "react";
import useDerivedState from "./useDerivedState";
import useControlledUpdateReducer from "./useControlledUpdateReducer";
import {identity} from "../../identity";

export const UNCONTROLLED_KEEP = Symbol(
    "Indicates that the component should manage the state for this prop, " +
    "but keep the last controlled state until another state change is made."
);

export const UNCONTROLLED_RESET = Symbol(
    "Indicates that the component should manage the state for this prop, " +
    "and reset it to its initial value."
);

export class UncontrolledResetOverride<S> {
    constructor(public readonly initialiserOverride: S) {}
}

export type Controllable<S> = S | typeof UNCONTROLLED_KEEP | typeof UNCONTROLLED_RESET | UncontrolledResetOverride<S>;

export function isControlled<S>(
    value: Controllable<S>
): value is S {
    return value !== UNCONTROLLED_KEEP && value !== UNCONTROLLED_RESET && !(value instanceof UncontrolledResetOverride);
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
    } else if (controlValue instanceof UncontrolledResetOverride) {
        return {
            value: controlValue.initialiserOverride,
            controlled: false
        }
    } else {
        return {
            value: init(),
            controlled: false
        }
    }
}

function identityAfterFirst<S>(
    f: (state: S) => S
): (state: S) => S {
    let closure: (state: S) => S = f

    return (state) => {
        const result = closure(state)
        closure = identity
        return result
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

    const valueTransition: (state: S) => S
        = useDerivedState(
            ([controlValue]) => {
                if (controlValue === UNCONTROLLED_RESET)
                    return identityAfterFirst(init)
                else if (controlValue instanceof UncontrolledResetOverride)
                    return identityAfterFirst(() => controlValue.initialiserOverride)
                else if (controlValue === UNCONTROLLED_KEEP)
                    return identity
                else
                    return () => controlValue
            },
            [controlValue] as const
        );

    const value = valueTransition(reducerState.value)

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
