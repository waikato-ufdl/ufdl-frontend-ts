import {StateMachineStates} from "./StateMachineStates";
import {StateMachineTransitions} from "./StateMachineTransitions";
import {Reducer} from "react";
import {StateMachineReducerState} from "./StateMachineReducerState";
import {StateMachineReducerAction} from "./StateMachineReducerAction";

/**
 * TODO
 */
export type StateMachineReducer<
    States extends StateMachineStates,
    StatesTransitions extends StateMachineTransitions<States>
> = Reducer<
    StateMachineReducerState<States, StatesTransitions>,
    StateMachineReducerAction<States>
>