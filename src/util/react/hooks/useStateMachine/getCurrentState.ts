import {Dispatch} from "react";
import {rendezvous} from "../../../typescript/async/rendezvous";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateAndData} from "./types/StateAndData";
import {StateMachineReducerAction} from "./types/StateMachineReducerAction";

/**
 * Uses the state transition dispatch to get the current state.
 *
 * @param stateMachineReducerDispatch
 *          The reducer dispatch for the state-machine.
 * @return
 *          A promise of the current state.
 */
export default function getCurrentState<
    States extends StateMachineStates
>(
    stateMachineReducerDispatch: Dispatch<StateMachineReducerAction<States>>
): Promise<StateAndData<States>> {

    // Set up a rendezvous to receive the current state from the reducer when available
    const [currentStateAndDataPromise, resolveCurrentStateAndData] = rendezvous<StateAndData<States>>();

    // Pass the transition to the reducer
    stateMachineReducerDispatch([resolveCurrentStateAndData, undefined]);

    return currentStateAndDataPromise;
}
