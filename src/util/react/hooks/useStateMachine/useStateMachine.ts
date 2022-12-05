import {Dispatch, useEffect, useReducer} from "react";
import useStateSafe from "../useStateSafe";
import useDerivedState from "../useDerivedState";
import {AUTOMATIC} from "./AUTOMATIC";
import extractAutomaticTransitions from "./extractAutomaticTransitions";
import stateMachineReducer from "./stateMachineReducer";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateAndData} from "./types/StateAndData";
import {StateMachineReducerAction} from "./types/StateMachineReducerAction";
import {StateMachineTransitions} from "./types/StateMachineTransitions";
import {StateMachineReducerState} from "./types/StateMachineReducerState";
import {StateMachineReducer} from "./types/StateMachineReducer";
import {StateMachineDispatch} from "./types/StateMachineDispatch";
import createStateTransitionsDispatch from "./createStateTransitionsDispatch";
import createCheckForStateChange from "./createCheckForStateChange";
import createStateTransitionAction from "./createStateTransitionAction";
import {AutomaticStateTransition} from "./types/AutomaticStateTransition";
import {StateMachineErrorTransitionHandler} from "./types/StateMachineErrorTransitionHandler";

/**
 * Hook which creates a state-machine with defined states and transitions between
 * states.
 *
 * @param transitionsInit
 *          Initialiser of the [transitions]{@link StateMachineTransitions} for the
 *          state-machine. Only called on first use, so changing this has no effect.
 * @param init
 *          Initialiser of the initial state for the state-machine. Only called on
 *          first use, so changing this has no effect.
 * @param errorTransitionHandler
 *          An optional [handler]{@link StateMachineErrorTransitionHandler} which will
 *          be called if an exception occurs in any other transition (either manual
 *          or automatic) to transition to another state. If omitted, the exception will
 *          be logged and no state transition will occur. This is also the behaviour if
 *          the given handler itself throws an exception. Only consumed on first use,
 *          so changing this has no effect.
 * @return
 *          A [dispatch]{@link StateMachineDispatch} object allowing interaction with
 *          the state-machine.
 */
export default function useStateMachine<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>
>(
    transitionsInit: () => Transitions,
    init: () => StateAndData<States>,
    errorTransitionHandler?: StateMachineErrorTransitionHandler<States>
): StateMachineDispatch<States, Transitions> {
    // Save the transitions
    const [transitions] = useStateSafe(transitionsInit);

    // Need to create a closure around the state-machine's dispatch so that
    // we can pass it to the reducer it comes from
    let reducerState: StateMachineReducerState<States, Transitions>;
    let reducerDispatch: Dispatch<StateMachineReducerAction<States>>;
    [reducerState, reducerDispatch] = useReducer<StateMachineReducer<States, Transitions>, void>(
        stateMachineReducer,
        undefined,
        () => {
            return {
                stateMachineStateAndData: init(),
                [AUTOMATIC]: extractAutomaticTransitions<States, Transitions>(transitions),
                reducerDispatch: transition => reducerDispatch(transition),
                errorTransition: errorTransitionHandler
            }
        }
    );

    // Automatic transitions won't be triggered on initialisation, so do that here
    useEffect(
        () => {
            // Get the initial state
            const initialState = reducerState.stateMachineStateAndData

            // Try to get the automatic transition for the initial state
            const automaticTransition = reducerState[AUTOMATIC][initialState.state];

            // Nothing to do if there is no automatic transition
            if (automaticTransition === undefined) return;

            reducerDispatch(
                createStateTransitionAction(
                    initialState,
                    // We can't show that the automatic transition can take the initial state at compile time, but this is
                    // necessarily the case due to the AllowedFromStates type-arg on the AutomaticStateTransition type
                    // being required to match the key under which it is stored in AutomaticStateTransitions, which is
                    // initialState.state above.
                    () => (automaticTransition as unknown as AutomaticStateTransition<States>).call(
                        initialState,
                        createCheckForStateChange(initialState, reducerDispatch)
                    ),
                    AUTOMATIC
                )
            )
        },
        [reducerDispatch] as const
    );

    // Create and return the dispatch object
    return useDerivedState(
        ([stateAndData, transitions, reducerDispatch]) => {
            return {
                ...stateAndData,
                transitions: createStateTransitionsDispatch(transitions, stateAndData, reducerDispatch)
            }
        },
        [reducerState.stateMachineStateAndData, transitions, reducerDispatch] as const
    );
}
