import {StateMachineStates} from "./types/StateMachineStates";
import {StateAndData} from "./types/StateAndData";

export function isAllowedState<
    States extends StateMachineStates,
    AllowedStates extends keyof States
>(
    state: keyof States,
    ...allowedStates: readonly AllowedStates[]
): state is AllowedStates {
    return (allowedStates as readonly (keyof States)[]).indexOf(state) !== -1
}

export function isAllowedStateAndData<
    States extends StateMachineStates,
    AllowedStates extends keyof States
>(
    stateAndData: StateAndData<States>,
    ...allowedStates: readonly AllowedStates[]
): stateAndData is StateAndData<States, AllowedStates> {
    return isAllowedState(stateAndData.state, ...allowedStates)
}
