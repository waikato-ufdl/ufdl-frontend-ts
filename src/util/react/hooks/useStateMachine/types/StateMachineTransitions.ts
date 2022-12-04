import {StateMachineStates} from "./StateMachineStates";
import {ManualStateTransition} from "./ManualStateTransition";
import {AUTOMATIC} from "../AUTOMATIC";
import {AutomaticStateTransition} from "./AutomaticStateTransition";

/**
 * The base-type of the state-transitions for a state-machine. The keys are the
 * state-names of the state-machine and the values are objects containing:
 *  - the named manual state-transitions for the respective state, and optionally,
 *  - an automatic transition for the state
 */
export type StateMachineTransitions<
    States extends StateMachineStates
> = {
    readonly [State in keyof States]: {
        readonly [transition: string]: ManualStateTransition<States, State, any>
        readonly [AUTOMATIC]?: AutomaticStateTransition<States, State>
    }
}
