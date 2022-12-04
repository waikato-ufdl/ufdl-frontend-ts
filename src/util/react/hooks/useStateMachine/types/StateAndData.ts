import {StateMachineStates} from "./StateMachineStates";

/**
 * The type of object containing both a state, and it's related data.
 */
export type StateAndData<
    States extends StateMachineStates,
    SelectedStates extends keyof States = keyof States
> = {
    [StateName in SelectedStates]: {
        readonly state: StateName,
        readonly data: States[StateName]
    }
}[SelectedStates]
