import {StateMachineStates} from "./StateMachineStates";
import {StateAndData} from "./StateAndData";

/**
 * Because state-machines are asynchronous, transition functions can only attempt
 * to change the state of the machine. This type represents that attempt, being one of:
 *  - The state to try to transition to, or,
 *  - as above, but with an additional callback to call with whether the transition succeeded, or
 *  - void, to perform no attempt to transition.
 */
export type StateTransitionAttempt<States extends StateMachineStates>
    = StateAndData<States> | [StateAndData<States>, (success: boolean) => void] | void
