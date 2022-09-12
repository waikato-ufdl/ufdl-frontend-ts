import {StateAndData, StatesBase, ValidStates} from "./types";

export function isAllowedState<
    States extends StatesBase,
    AllowedStates extends keyof ValidStates<States>
>(
    state: keyof ValidStates<States>,
    ...allowedStates: readonly AllowedStates[]
): state is AllowedStates {
    return (allowedStates as readonly (keyof ValidStates<States>)[]).indexOf(state) !== -1
}

export function isAllowedStateAndData<
    States extends StatesBase,
    AllowedStates extends keyof ValidStates<States>
>(
    stateAndData: StateAndData<ValidStates<States>>,
    ...allowedStates: readonly AllowedStates[]
): stateAndData is StateAndData<States, AllowedStates> {
    return isAllowedState(stateAndData.state, ...allowedStates)
}
