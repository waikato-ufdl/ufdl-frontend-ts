import {StateAndData, StatesBase} from "./types";

/**
 * Creates a new state/data object for a state machine.
 *
 * **WARNING**: Should only be used with an explicit constant
 * for 'state'. If the generic type of State is a union of states,
 * can possibly lead to an invalid state-machine state.
 *
 * @param state
 *          The state.
 * @param data
 *          The data for the state.
 * @return
 *          The state/data object.
 */
export default function createNewState<
    States extends StatesBase,
    State extends keyof States
> (
    state: State,
    data: States[State]
): StateAndData<States, State> {
    return {state: state, data: data} as any;
}
