import {StateMachineStates} from "./StateMachineStates";
import {StateMachineTransitions} from "./StateMachineTransitions";
import {StateAndData} from "./StateAndData";
import {AUTOMATIC} from "../AUTOMATIC";
import {AutomaticStateTransitions} from "./AutomaticStateTransitions";
import {Dispatch} from "react";
import {StateMachineReducerAction} from "./StateMachineReducerAction";
import {StateMachineErrorTransitionHandler} from "./StateMachineErrorTransitionHandler";

/**
 * The internal state of the state-machine reducer.
 *
 * @property stateMachineStateAndData
 *          The current state and data of the state-machine.
 * @property [AUTOMATIC]
 *          The automatic transitions for all state-machine states
 *          (so they can be trigger internally from the reducer).
 * @property reducerDispatch
 *          The reducer's own dispatch, so it can be passed automatic transitions.
 * @param errorTransition
 *          An optional [handler]{@link StateMachineErrorTransitionHandler} which will
 *          be called if an exception occurs in any other transition (either manual
 *          or automatic) to transition to another state. If omitted, the exception will
 *          be logged and no state transition will occur. This is also the behaviour if
 *          the given handler itself throws an exception. Only consumed on first use,
 *          so changing this has no effect.
 */
export type StateMachineReducerState<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>
> = {
    stateMachineStateAndData: StateAndData<States>,
    [AUTOMATIC]: AutomaticStateTransitions<States, Transitions>,
    reducerDispatch: Dispatch<StateMachineReducerAction<States>>
    errorTransitionHandler?: StateMachineErrorTransitionHandler<States>
}
