import {LoopStates} from "./LoopStates";
import {StateAndData} from "../../../../../util/react/hooks/useStateMachine/types/StateAndData";
import {StateMachineReducerAction} from "../../../../../util/react/hooks/useStateMachine/types/StateMachineReducerAction";

export type LoopStateAndData<
    SelectedStates extends keyof LoopStates = keyof LoopStates
> = StateAndData<LoopStates, SelectedStates>

export type LoopStateTransition = StateMachineReducerAction<LoopStates>
