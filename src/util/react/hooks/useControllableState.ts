import {Dispatch, useEffect} from "react";
import useDerivedState from "./useDerivedState";
import useControlledUpdateReducer from "./useControlledUpdateReducer";
import {identity} from "../../identity";

/**
 * Indicates that the component should manage the state for this prop,
 * but keep the last controlled state until another state change is made.
 */
export const UNCONTROLLED_KEEP = Symbol(
    "Indicates that the component should manage the state for this prop, " +
    "but keep the last controlled state until another state change is made."
)

/**
 * Indicates that the component should manage the state for this prop,
 * and reset it to its default initial value.
 */
export const UNCONTROLLED_RESET = Symbol(
    "Indicates that the component should manage the state for this prop, " +
    "and reset it to its default initial value."
)

/**
 * Indicates that the component should manage the state for this prop,
 * and reset it to the provided value.
 */
export class UncontrolledResetOverride<S> {
    constructor(public readonly initialiserOverride: S) {}
}

/**
 * The types of values that can be passed to a component prop which controls that component's internal state.
 * Either an explicit value in order to control the state, or one of the uncontrolled specifiers, to let the
 * component self-manage the state:
 *
 * - {@link UNCONTROLLED_KEEP}
 * - {@link UNCONTROLLED_RESET}
 * - {@link UncontrolledResetOverride}
 */
export type Controllable<S> =
    | S
    | typeof UNCONTROLLED_KEEP
    | typeof UNCONTROLLED_RESET
    | UncontrolledResetOverride<S>;

/**
 * Checks if the control prop value is an explicit controlling value.
 *
 * @param value
 *          The control prop value to check.
 */
export function isControlled<S>(
    value: Controllable<S>
): value is S {
    // Check it is not one of the uncontrolled specifiers
    return value !== UNCONTROLLED_KEEP
        && value !== UNCONTROLLED_RESET
        && !(value instanceof UncontrolledResetOverride)
}

/**
 * Maps a control value from one domain to another.
 *
 * @param controllable
 *          The control value to map.
 * @param mapFunc
 *          Function which maps a plain value source to target domain.
 * @return
 *          An equivalent control value in the target domain.
 */
export function mapControllable<T, R>(
    controllable: Controllable<T>,
    mapFunc: (value: T) => R
): Controllable<R> {
    // If the control value is just a flag, no mapping necessary (same in both domains)
    if (controllable === UNCONTROLLED_RESET || controllable === UNCONTROLLED_KEEP) {
        return controllable
    }

    // If it's a reset override, map the override value
    if (controllable instanceof UncontrolledResetOverride) {
        return new UncontrolledResetOverride(mapFunc(controllable.initialiserOverride))
    }

    // Otherwise map the explicit control value
    return mapFunc(controllable)
}

type ControllableReducerState<S> = {
    controlled: boolean
    value: S
}

type UpdateControlValueAction<S> = {
    isControl: true
    controlled: boolean
    value: S
}

type UpdateStateValueAction<S> = {
    isControl: false
    value: S
}

type ControllableReducerAction<S> =
    | UpdateControlValueAction<S>
    | UpdateStateValueAction<S>

function controllableStateReducer(
    prevState: ControllableReducerState<any>,
    action: ControllableReducerAction<any>
): ControllableReducerState<any> {
    // If this is an inline update, immediate adopt it
    if (action.isControl) {
        return {
            controlled: action.controlled,
            value: action.value
        };
    }

    // Ignore calls to set the state when it is externally controlled
    if (prevState.controlled) return prevState;

    return {
        controlled: false,
        value: action.value
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

/**
 * Modifies a function so that each time it is called subsequent to the first time,
 * it acts as the identity function. Performs no error-handling, so techinically it
 * becomes the identity after the first successful call to the source function.
 *
 * @param sourceFunction
 *          The function to modify.
 * @return
 *          The modified version of the function.
 */
function identityAfterFirst<S>(
    sourceFunction: (state: S) => S
): (state: S) => S {
    // Create a closure state to remember which function to call next,
    // the source function or the identity function. Initially this is
    // the source function
    let callNext: (state: S) => S = sourceFunction

    // Return a wrapped function which...
    return (state) => {
        // Calls the next function to call, ...
        const result = callNext(state)

        // Sets the next function to call to the identity, so it will always be the identity
        // after the first call to this wrapped function
        callNext = identity

        // Returns the result of the function call
        return result
    }
}

/**
 * Similar to {@link React.useState}, but takes a controllable value which determines if the
 * state mirrors that value, or is allowed to be set by the containing component.
 *
 * @param controlValue
 *          The component prop value which should control this piece of state.
 * @param init
 *          The initialiser function for when the state is reset.
 * @return
 *          - The state's value, which mirrors the control value if it is explicitly controlled.
 *          - A function to set the state, which ignores calls made when the state is being controlled.
 *          - A flag identifying if the state is being controlled.
 */
export function useControllableState<S>(
    controlValue: Controllable<S>,
    init: () => S
): [S, Dispatch<S>, boolean] {
    // Create a reducer which holds the controlled/uncontrolled state, and filters updates based on if the
    // state change was caused by a new controlling prop value, or a call to the dispatch function
    const [reducerState, dispatch] = useControlledUpdateReducer<ControllableReducerState<S>, ControllableReducerAction<S>>(
        controllableStateReducer,
        () => createInitialControllableReducerState(controlValue, init)
    );

    // Is the control value controlling the state?
    const controlled = isControlled(controlValue);

    // Work out how to transition from the current state value to the next state value, based on the
    // control value
    const valueTransition: (state: S) => S
        = useDerivedState(
            ([controlValue]) => {
                // When the control value first changes to uncontrolled-reset, reset the state to the initial
                // value, and from then on let it be changed by the containing component
                if (controlValue === UNCONTROLLED_RESET)
                    return identityAfterFirst(init)

                // When the control value first changes to uncontrolled-reset with an override for the default
                // initial state, reset the state to the override value, and from then on let it be changed by
                // the containing component
                if (controlValue instanceof UncontrolledResetOverride)
                    return identityAfterFirst(() => controlValue.initialiserOverride)

                // While the control value is uncontrolled-keep, let it be changed by the containing component,
                // and don't reset it
                if (controlValue === UNCONTROLLED_KEEP)
                    return identity

                // Otherwise the control value is explicit, and so force the state to the control value
                return () => controlValue
            },
            [controlValue] as const
        );

    // Perform the transition from the current state to the next state, based on the control value.
    // Do this inline so the new state value is available immediately
    const value = valueTransition(reducerState.value)

    // Use an effect to silently update the internal state to the next state we just determined
    useEffect(
        () => {
            dispatch({isControl: true, controlled: controlled, value: value}, false)
        },
        [dispatch, controlled, value]
    );

    // Derive a dispatch function (similar to that returned by useState) which reacts when it is called
    const setState = useDerivedState(
        () => (state: S) => dispatch({isControl: false, value: state}, true),
        [dispatch]
    );

    return [value, setState, controlled];
}
