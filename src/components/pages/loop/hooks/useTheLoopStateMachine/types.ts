import {StateAndData, StateTransition} from "../../../../../util/react/hooks/useStateMachine/types";
import {LoopStates} from "./LoopStates";

export type LoopStateAndData<
    SelectedStates extends keyof LoopStates = keyof LoopStates
> = StateAndData<LoopStates, SelectedStates>

export type LoopStateTransition = StateTransition<LoopStates>
