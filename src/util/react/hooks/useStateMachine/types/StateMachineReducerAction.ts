import {StateMachineStates} from "./StateMachineStates";
import {StateAndData} from "./StateAndData";
import {StateTransitionAttempt} from "./StateTransitionAttempt";
import {AUTOMATIC} from "../AUTOMATIC";
import {PossiblePromise} from "../../../../typescript/types/promise";

/**
 * An action to change the state-machine's state.
 *
 * FIXME: Out of date.
 *
 * @param current
 *          The current state of the state-machine.
 * @return
 *          The new state of the state-machine, a promise thereof,
 *          or undefined to abort the transition.
 */
export type StateMachineReducerAction<
    States extends StateMachineStates
> = [(current: StateAndData<States>) => PossiblePromise<StateTransitionAttempt<States>>, (string | typeof AUTOMATIC)?]
