import {LoopStates} from "../LoopStates";
import {StateAndData} from "../../../../../../util/react/hooks/useStateMachine/types/StateAndData";

export type LoopStateAndData<
    SelectedStates extends keyof LoopStates = keyof LoopStates
> = StateAndData<LoopStates, SelectedStates>