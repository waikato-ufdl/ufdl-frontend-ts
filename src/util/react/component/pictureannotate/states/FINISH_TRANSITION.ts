import {ManualStateTransition} from "../../../hooks/useStateMachine/types/ManualStateTransition";
import {AnnotatingStates} from "./AnnotatingStates";
import {createNewAnnotatingState} from "./createNewAnnotationState";

export const FINISH_TRANSITION: ManualStateTransition<AnnotatingStates, keyof AnnotatingStates, []>
    = function () {
        return createNewAnnotatingState("Idle")()
    }
