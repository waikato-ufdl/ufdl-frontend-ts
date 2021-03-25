import {StateAndData, StatesBase, StateTransition} from "./types";
import {Dispatch} from "react";
import {rendezvous} from "../../../typescript/async/rendezvous";

/**
 * Uses the state transition dispatch to get the current state.
 *
 * @param changeState
 *          The transition dispatch.
 * @return
 *          A promise of the current state.
 */
export default function getCurrentState<
    States extends StatesBase
>(
    changeState: Dispatch<StateTransition<States>>
): Promise<StateAndData<States>> {

    const [promise, resolve] = rendezvous<StateAndData<States>>();

    const transition: StateTransition<States> = (
        current
    ) => {
        resolve(current);
    };

    changeState(transition);

    return promise;
}
