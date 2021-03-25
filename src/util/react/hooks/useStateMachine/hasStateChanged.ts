import {StateAndData, StatesBase, StateTransition} from "./types";
import {Dispatch} from "react";
import getCurrentState from "./getCurrentState";

/**
 * Uses the state transition dispatch to check if the state has changed.
 *
 * @param from
 *          The state to compare the current state to.
 * @param changeState
 *          The transition dispatch.
 * @return
 *          A promise of the result.
 */
export default async function hasStateChanged<
    States extends StatesBase
>(
    from: StateAndData<States>,
    changeState: Dispatch<StateTransition<States>>
): Promise<boolean> {

    return from !== await getCurrentState(changeState);
}
