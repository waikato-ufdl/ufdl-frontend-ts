import {StateAndData} from "./StateAndData";
import {AUTOMATIC} from "../AUTOMATIC";
import {StateTransitionAttempt} from "./StateTransitionAttempt";
import {StateMachineStates} from "./StateMachineStates";

/**
 * Handler function for when an error occurs in a state-machine transition function.
 *
 * @param stateAndData
 *          The [state/data]{@link StateAndData} that the state-machine was in when the error occurred.
 * @param transition
 *          The transition that threw the error.
 * @param reason
 *          The error that was thrown in the transition.
 * @return
 *          A possible synchronous [attempt]{@link StateTransitionAttempt} to transition to another state.
 */
export type StateMachineErrorTransitionHandler<States extends StateMachineStates>
    = (
    stateAndData: StateAndData<States>,
    transition: string | typeof AUTOMATIC,
    reason: any
) => StateTransitionAttempt<States>
