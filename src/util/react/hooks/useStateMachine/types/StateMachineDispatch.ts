import {StateMachineStates} from "./StateMachineStates";
import {StateMachineTransitions} from "./StateMachineTransitions";
import {StateTransitionsDispatch} from "./StateTransitionsDispatch";

/**
 * The type returned by {@link useStateMachine}, allowing interaction via reading
 * the current state, and initiating state transitions.
 */
export type StateMachineDispatch<
    States extends StateMachineStates,
    StatesTransitions extends StateMachineTransitions<States>,
    SelectedStates extends keyof States = keyof States
> = {
    readonly [StateName in SelectedStates]: {
        state: StateName,
        data: States[StateName],
        transitions: StateTransitionsDispatch<States, StatesTransitions>[StateName]
    }
}[SelectedStates]
