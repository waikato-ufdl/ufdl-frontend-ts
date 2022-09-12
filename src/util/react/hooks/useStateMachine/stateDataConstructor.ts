import {StateAndData, StatesBase, ValidStates} from "./types";

export type StateDataConstructor<
    States extends StatesBase,
    State extends keyof ValidStates<States>
> = {
    [StateName in State]: (data: States[StateName]) => StateAndData<States, StateName>
}[State]

/**
 * Creates a function to aid in constructing the data-type for
 * a given loop-state.
 *
 * @param state
 *          The state to get a constructor for.
 * @return
 *          A function which takes the data and ties it to the state.
 */
export function stateDataConstructor<
    States extends StatesBase,
    State extends keyof ValidStates<States>
> (
    state: State
): StateDataConstructor<States, State> {
    return (
        (data) => {
            return {
                state: state,
                data: data
            }
        }
    )
}
