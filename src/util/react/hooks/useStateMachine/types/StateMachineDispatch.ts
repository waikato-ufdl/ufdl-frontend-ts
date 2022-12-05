import {StateMachineStates} from "./StateMachineStates";
import {StateMachineTransitions} from "./StateMachineTransitions";
import {StateTransitionsDispatch} from "./StateTransitionsDispatch";

/**
 * The type returned by {@link useStateMachine}, allowing interaction via reading
 * the current state, and initiating state transitions.
 *
 * @property state
 *          The current state of the state-machine.
 * @property data
 *          The current parameterisation data of the state.
 * @property transitions
 *          A [dispatch]{@link StateTransitionsDispatch} for triggering manual state-transitions.
 */
export type StateMachineDispatch<
    States extends StateMachineStates,
    StatesTransitions extends StateMachineTransitions<States>,
    SelectedStates extends keyof States = keyof States
> = {
    readonly [StateName in SelectedStates]: {
        readonly state: StateName,
        readonly data: States[StateName],
        readonly transitions: StateTransitionsDispatch<States, StatesTransitions>[StateName]
    }
}[SelectedStates]
