import {StateMachineReducerAction} from "./types/StateMachineReducerAction";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateAndData} from "./types/StateAndData";
import {StateTransitionAttempt} from "./types/StateTransitionAttempt";
import callAttemptCallback from "./callAttemptCallback";
import {anyToString} from "../../../typescript/strings/anyToString";
import {AUTOMATIC} from "./AUTOMATIC";
import {PossiblePromise} from "../../../typescript/types/promise";

/**
 * Creates a reducer action which attempts to transition to the given
 * state.
 *
 * @param creationTimeStateAndData
 *          The state and data at the time the transition was triggered. If
 *          the state-machine isn't in the same state when the new state
 *          resolves, the transition is aborted.
 * @param getAttempt
 *          Function which returns the transition attempt. Is called immediately,
 *          any errors thrown are handled by the state machine (will be ignored if
 *          the state transition is no longer valid).
 * @param transition
 *          Optionally, the name of the transition that is occuring.
 * @return
 *          A reducer action for the state-transition.
 */
export default function createStateTransitionAction<
    States extends StateMachineStates
>(
    creationTimeStateAndData: StateAndData<States>,
    getAttempt: () => PossiblePromise<StateTransitionAttempt<States>>,
    transition: string | typeof AUTOMATIC
): StateMachineReducerAction<States> {
    let attemptFunction: (current: StateAndData<States>) => PossiblePromise<StateTransitionAttempt<States>>
    try {
        const attempt = getAttempt()
        attemptFunction = currentStateAndData => {
            // Check the state/data hasn't changed
            if (currentStateAndData !== creationTimeStateAndData) {
                callAttemptCallback(attempt, false)
                return undefined
            }

            return attempt
        }
    } catch (e) {
        attemptFunction = currentStateAndData => {
            // Check the state/data hasn't changed
            if (currentStateAndData !== creationTimeStateAndData) {
                console.log(
                    `Error occurred in '${anyToString(transition)}' transition function ` +
                    `in state '${anyToString(creationTimeStateAndData.state)}', but the state-machine ` +
                    `had already transitioned to state '${anyToString(currentStateAndData.state)}'`,
                    e
                )
                return undefined
            }

            throw e
        }
    }

    return [attemptFunction, transition]
}
