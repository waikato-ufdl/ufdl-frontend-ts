import {
    AutomaticStateTransition,
    ManualStateTransition
} from "../../../../../util/react/hooks/useStateMachine/types";
import {LoopStates} from "./LoopStates";


export function createManualLoopTransition<
    Transition extends ManualStateTransition<LoopStates>
>(
    transition: Transition
): Transition {
    return transition;
}

export function createAutomaticTransition<
    Transition extends AutomaticStateTransition<LoopStates>
>(
    transition: Transition
): Transition {
    return transition;
}
