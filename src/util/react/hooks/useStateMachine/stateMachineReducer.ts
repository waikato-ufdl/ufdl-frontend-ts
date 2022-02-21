import {
    StateMachineReducerState,
    StatesBase,
    StatesTransitionsBase, StateTransition
} from "./types";
import {AUTOMATIC} from "./AUTOMATIC";
import doAsync from "../../../typescript/async/doAsync";
import isPromise from "../../../typescript/async/isPromise";

/**
 * Reducer function which handles transitions for a state machine.
 *
 * @param prevState
 *          The prior state of the state machine.
 * @param action
 *          The transition to perform.
 */
export default function stateMachineReducer<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
>(
    prevState: StateMachineReducerState<States, StatesTransitions>,
    action: StateTransition<States>
) {
    // Get the new state from the transition function
    const newState = action(prevState.state);

    // If no new state was returned, remain in the same state
    if (newState === undefined) return prevState;

    // If a new state is promised, schedule the state change to happen in future
    if (isPromise(newState)) {
        const state = prevState.state;
        newState.then(
            (newState) => {
                prevState.dispatch(
                    (prevState) => {
                        if (prevState !== state) return;
                        return newState;
                    }
                )
            }
        )

        return prevState;
    }

    // See if the new state has an automatic transition
    const automaticTransitionForNewState = prevState[AUTOMATIC][newState.state as any];

    // If it does, trigger it
    if (automaticTransitionForNewState !== undefined) {
        doAsync(() => automaticTransitionForNewState(newState as any, prevState.dispatch));
    }

    return {
        state: newState,
        [AUTOMATIC]: prevState[AUTOMATIC],
        dispatch: prevState.dispatch
    };
};
