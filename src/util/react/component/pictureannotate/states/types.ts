import {AnnotatingStates} from "./AnnotatingStates";
import {StateAndData} from "../../../hooks/useStateMachine/types/StateAndData";

export type AnnotatingStateAndData<
    SelectedStates extends keyof AnnotatingStates = keyof AnnotatingStates
> = StateAndData<AnnotatingStates, SelectedStates>
