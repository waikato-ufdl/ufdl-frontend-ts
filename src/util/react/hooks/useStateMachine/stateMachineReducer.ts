import {AUTOMATIC} from "./AUTOMATIC";
import isPromise from "../../../typescript/async/isPromise";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateMachineReducerAction} from "./types/StateMachineReducerAction";
import {StateMachineTransitions} from "./types/StateMachineTransitions";
import {StateMachineReducerState} from "./types/StateMachineReducerState";
import {STATE_CHANGED} from "./STATE_CHANGED";
import createStateTransitionAction from "./createStateTransitionAction";
import onPromiseCompletion from "../../../typescript/async/onPromiseCompletion";
import {inlineResult} from "../../../typescript/result";
import {AutomaticStateTransitions} from "./types/AutomaticStateTransitions";
import createCheckForStateChange from "./createCheckForStateChange";
import {StateTransitionAttempt} from "./types/StateTransitionAttempt";
import {isArray} from "../../../typescript/arrays/isArray";
import callAttemptCallback from "./callAttemptCallback";
import UNREACHABLE from "../../../typescript/UNREACHABLE";
import {anyToString} from "../../../typescript/strings/anyToString";
import {AutomaticStateTransition} from "./types/AutomaticStateTransition";
import {PossiblePromise} from "../../../typescript/types/promise";

/**
 * Reducer function which handles transitions for a state machine.
 *
 * @param prevState
 *          The current [state]{@link StateMachineReducerState} of the state machine.
 * @param action
 *          The transition to perform.
 * @return
 *          The new state of the state-machine.
 */
export default function stateMachineReducer<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>
>(
    prevState: StateMachineReducerState<States, Transitions>,
    action: StateMachineReducerAction<States>
): StateMachineReducerState<States, Transitions> {
    const [getTransitionAttempt, transitionName] = action

    // Try to get the transition attempt
    let transitionAttempt: PossiblePromise<StateTransitionAttempt<States>>
    try {
        transitionAttempt = getTransitionAttempt(prevState.stateMachineStateAndData);
    } catch (transitionAttemptError) { // Handle errors in state-transitions
        // STATE_CHANGED is excluded as it is automatically thrown to cancel automatic transitions
        if (transitionAttemptError === STATE_CHANGED) return prevState

        // transitionName should always be defined for throwing transitions
        if (transitionName === undefined) UNREACHABLE("transitionName should always be defined for throwing transitions")

        // If no error-handler is defined, record the error to the console, and don't change state
        if (prevState.errorTransitionHandler === undefined) {
            console.error(
                `Error occurred in state-machine transition '${transitionName === AUTOMATIC ? "[AUTOMATIC]" : transitionName}' ` +
                `of state '${anyToString(prevState.stateMachineStateAndData.state)}'`,
                transitionAttemptError
            )
            return prevState
        }

        try {
            const errorTransitionAttempt = prevState.errorTransitionHandler(
                prevState.stateMachineStateAndData,
                transitionName,
                transitionAttemptError
            )

            // Recurse to handle the error transition attempt
            return stateMachineReducer(
                prevState,
                createStateTransitionAction(
                    prevState.stateMachineStateAndData,
                    () => errorTransitionAttempt,
                    transitionName
                )
            )
        } catch (errorTransitionAttemptError) {
            // If the error-handler also threw an error, record to console and don't change state
            console.error(
                `Error occurred in state-machine transition '${transitionName === AUTOMATIC ? "[AUTOMATIC]" : transitionName}' ` +
                `of state '${anyToString(prevState.stateMachineStateAndData.state)}'`,
                transitionAttemptError,
                `While attempting to handle the error, the provided error-handler also experienced ` +
                `an error`,
                errorTransitionAttemptError
            )
            return prevState
        }
    }

    // If no attempt was made, remain in the same state
    if (transitionAttempt === undefined) return prevState;

    // If a new state is promised, schedule the state change to happen in future
    if (isPromise(transitionAttempt)) {
        // transitionName is only undefined when checking for state change in automatic transitions,
        // which always returns void and so never reaches here
        if (transitionName === undefined) UNREACHABLE("transitionName should always be defined for async transitions")

        onPromiseCompletion(
            transitionAttempt,
            result => prevState.reducerDispatch(
                createStateTransitionAction(
                    prevState.stateMachineStateAndData,
                    () => inlineResult(result),
                    transitionName
                )
            )
        )

        return prevState;
    }

    // Unwrap the attempt
    const newState = isArray(transitionAttempt) ? transitionAttempt[0] : transitionAttempt

    // At this point, the transition is considered complete, so call the callback
    callAttemptCallback(transitionAttempt, true)

    // Create the new state for the reducer
    const newReducerState = {
        ...prevState,
        stateMachineStateAndData: newState
    }

    // See if the new state has an automatic transition
    const automaticTransitionForNewState: AutomaticStateTransitions<States, Transitions>[keyof States] = prevState[AUTOMATIC][newState.state];

    // If it does, trigger it and handle the result by recursion
    if (automaticTransitionForNewState !== undefined) {
        return stateMachineReducer(
            newReducerState,
            createStateTransitionAction(
                newState,
                // We can't show that the automatic transition can take the new state at compile time, but this is
                // necessarily the case due to the AllowedFromStates type-arg on the AutomaticStateTransition type
                // being required to match the key under which it is stored in AutomaticStateTransitions, which is
                // newState.state in the line above.
                () => (automaticTransitionForNewState as AutomaticStateTransition<States>).call(
                    newState,
                    createCheckForStateChange(newState, prevState.reducerDispatch)
                ),
                AUTOMATIC
            )
        )
    }

    return newReducerState
};
