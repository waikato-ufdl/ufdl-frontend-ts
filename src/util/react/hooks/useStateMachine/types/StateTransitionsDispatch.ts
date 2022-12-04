import {StateMachineStates} from "./StateMachineStates";
import {StateMachineTransitions} from "./StateMachineTransitions";
import {ManualStateTransitions} from "./ManualStateTransitions";

/**
 * The type of object for initiating state transitions against a state-machine.
 */
export type StateTransitionsDispatch<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>
> = {
    readonly [StateName in keyof States]: {
        readonly [TransitionName in keyof ManualStateTransitions<States, Transitions>[StateName]]: (
            ...args: Parameters<OmitThisParameter<ManualStateTransitions<States, Transitions>[StateName][TransitionName]>>
        ) => void
    }
}
