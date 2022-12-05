import {StateMachineStates} from "./types/StateMachineStates";
import {StateDataConstructor} from "./types/StateDataConstructor";

/**
 * Creates a function to aid in constructing the parameterised data-type for
 * a given loop-state.
 *
 * @param state
 *          The state to get a constructor for.
 * @return
 *          A function which takes the data and ties it to the state.
 */
export function stateDataConstructor<
    States extends StateMachineStates,
    State extends keyof States
> (
    state: State
): StateDataConstructor<States, State> {
    return data => {
        return {
            state: state,
            data: data
        }
    }
}
