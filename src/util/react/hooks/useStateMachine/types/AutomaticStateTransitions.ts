import {StateMachineStates} from "./StateMachineStates";
import {StateMachineTransitions} from "./StateMachineTransitions";
import {AUTOMATIC} from "../AUTOMATIC";

/**
 * Related type which extracts the automatic state-transitions from the state-transitions
 * of a state-machine.
 */
export type AutomaticStateTransitions<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>
> = {
    readonly [State in keyof States]: Transitions[State][typeof AUTOMATIC]
}