import {Dispatch, useEffect, useReducer} from "react";
import useStateSafe from "../useStateSafe";
import {
    StateMachineDispatch,
    StateAndData,
    StatesBase,
    StatesTransitionsBase,
    StatesTransitionsDispatch, StateTransition, StateMachineReducer, StateMachineReducerState, ValidStates
} from "./types";
import useDerivedState from "../useDerivedState";
import {AUTOMATIC} from "./AUTOMATIC";
import extractAutomaticTransitions from "./extractAutomaticTransitions";
import doAsync from "../../../typescript/async/doAsync";
import stateMachineReducer from "./stateMachineReducer";

export default function useStateMachine<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
>(
    transitionsInit: () => StatesTransitions,
    init: () => StateAndData<States>
): StateMachineDispatch<States, StatesTransitions> {
    // Save the transitions
    const [transitions] = useStateSafe(transitionsInit);

    let state: StateMachineReducerState<States, StatesTransitions>;
    let dispatch: Dispatch<StateTransition<States>>;

    const dispatchClosed: Dispatch<StateTransition<States>> = (transition) => {
        dispatch(transition);
    };

    [state, dispatch] = useReducer<StateMachineReducer<States, StatesTransitions>, undefined>(
        stateMachineReducer,
        undefined,
        () => {
            return {
                state: init(),
                [AUTOMATIC]: extractAutomaticTransitions(transitions),
                dispatch: dispatchClosed
            }
        }
    );

    // Get the transitions that apply to the current state of the state machine
    const transitionsForCurrentState = transitions[state.state.state];

    // Create an object which can be used to trigger any of the manual
    // transitions of the state machine
    const externalDispatch = useDerivedState(
        () => {
            return new Proxy(
                transitionsForCurrentState,
                {
                    get(
                        target: StatesTransitions[keyof ValidStates<States>],
                        p: keyof StatesTransitions[keyof ValidStates<States>]
                    ): any {
                        // The automatic transition is not available on the external dispatch
                        if (p === AUTOMATIC) return undefined;

                        return (...args: any) => dispatch(target[p](...args))
                    }
                } as any
            ) as StatesTransitionsDispatch<States, StatesTransitions>[keyof ValidStates<States>]
        },
        [state] as const
    );

    // Automatic transitions won't be triggered on initialisation, so do that here
    useEffect(
        () => {
            // Try to get the automatic transition for the initial state
            const automaticTransition = state[AUTOMATIC][state.state.state as any];

            // Nothing to do if there is no automatic transition
            if (automaticTransition === undefined) return;

            doAsync(() => automaticTransition(state.state as any, state.dispatch));
        },
        [dispatch] as const
    );

    return useDerivedState(
        ([
            state,
             externalDispatch
         ]) => {
            return {
                state: state.state.state,
                data: state.state.data,
                transitions: externalDispatch
            }
        },
        [state, externalDispatch] as const
    );
}
