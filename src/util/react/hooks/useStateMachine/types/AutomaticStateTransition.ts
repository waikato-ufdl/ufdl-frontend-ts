import {StateMachineStates} from "./StateMachineStates";
import {StateAndData} from "./StateAndData";
import {CheckForStateChangeFunction} from "./CheckForStateChangeFunction";
import {StateTransitionAttempt} from "./StateTransitionAttempt";
import {PossiblePromise} from "../../../../typescript/types/promise";

/**
 * The type of automatic state-transition functions.
 *
 * @param current
 *          The current state of the state-machine (with parameterised data).
 * @param checkForStateChange
 *          Function to check if the state has already been changed (for early abort). See
 *          {@link CheckForStateChangeFunction}.
 * @return
 *          The next state to automatically transition to.
 */
export type AutomaticStateTransition<
    States extends StateMachineStates,
    AllowedFromStates extends keyof States = keyof States
> = (
    this: StateAndData<States, AllowedFromStates>,
    checkForStateChange: CheckForStateChangeFunction
) => PossiblePromise<StateTransitionAttempt<States>>
