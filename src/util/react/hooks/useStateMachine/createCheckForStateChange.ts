import {CheckForStateChangeFunction} from "./types/CheckForStateChangeFunction";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateAndData} from "./types/StateAndData";
import {Dispatch} from "react";
import {StateMachineReducerAction} from "./types/StateMachineReducerAction";
import hasStateChanged from "./hasStateChanged";
import {STATE_CHANGED} from "./STATE_CHANGED";

/**
 * Creates the [checkForStateChange]{@link AutomaticStateTransition} function to
 * pass to automatic transitions from the state-machine reducer dispatch.
 *
 * @param creationTimeStateAndData
 *          The state/data at the time the automatic transition was triggered.
 * @param stateMachineReducerDispatch
 *          The reducer dispatch.
 * @return
 *          A {@link CheckForStateChangeFunction}.
 */
export default function createCheckForStateChange<
    States extends StateMachineStates
>(
    creationTimeStateAndData: StateAndData<States>,
    stateMachineReducerDispatch: Dispatch<StateMachineReducerAction<States>>
): CheckForStateChangeFunction {
    async function checkForStateChange(suppress?: false): Promise<void>
    async function checkForStateChange(suppress: true): Promise<boolean>
    async function checkForStateChange(suppress?: boolean): Promise<boolean | void> {
        const stateChanged = await hasStateChanged(creationTimeStateAndData, stateMachineReducerDispatch)

        if (suppress === true) return stateChanged

        if (stateChanged) throw STATE_CHANGED
    }

    return checkForStateChange
}