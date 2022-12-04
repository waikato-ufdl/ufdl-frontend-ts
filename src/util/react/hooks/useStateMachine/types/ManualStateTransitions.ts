import {StateMachineStates} from "./StateMachineStates";
import {StateMachineTransitions} from "./StateMachineTransitions";

/**
 * Extracts the manual state-transitions from the transitions-type of a state-machine.
 */
export type ManualStateTransitions<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>
> = {
    readonly [StateName in keyof States]: Omit<Transitions[StateName], symbol | number>
}
