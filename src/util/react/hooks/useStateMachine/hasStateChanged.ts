import {Dispatch} from "react";
import getCurrentState from "./getCurrentState";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateAndData} from "./types/StateAndData";
import {StateMachineReducerAction} from "./types/StateMachineReducerAction";

/**
 * Uses the state transition dispatch to check if the state has changed.
 *
 * @param creationTimeStateAndData
 *          The state to compare the current state to.
 * @param stateMachineReducerDispatch
 *          The reducer dispatch of the state-machine.
 * @return
 *          A promise of the result.
 */
export default async function hasStateChanged<
    States extends StateMachineStates
>(
    creationTimeStateAndData: StateAndData<States>,
    stateMachineReducerDispatch: Dispatch<StateMachineReducerAction<States>>
): Promise<boolean> {

    return creationTimeStateAndData !== await getCurrentState(stateMachineReducerDispatch);
}
