import {AnnotatingStates} from "./AnnotatingStates";
import {StateAndData, StateTransition} from "../../../hooks/useStateMachine/types";

export type AnnotatingStateAndData<
    SelectedStates extends keyof AnnotatingStates = keyof AnnotatingStates
> = StateAndData<AnnotatingStates, SelectedStates>

export type AnnotatingStateTransition = StateTransition<AnnotatingStates>
