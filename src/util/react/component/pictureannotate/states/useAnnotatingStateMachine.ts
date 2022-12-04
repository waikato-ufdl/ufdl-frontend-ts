import useStateMachine from "../../../hooks/useStateMachine/useStateMachine";
import {constantInitialiser} from "../../../../typescript/initialisers";
import {AnnotatingStates} from "./AnnotatingStates";
import {ANNOTATING_TRANSITIONS, AnnotatingTransitions} from "./AnnotatingTransitions";
import {StateMachineDispatch} from "../../../hooks/useStateMachine/types/StateMachineDispatch";
import {createNewAnnotatingState} from "./createNewAnnotationState";

export default function useAnnotatingStateMachine(
): StateMachineDispatch<AnnotatingStates, AnnotatingTransitions> {
    return useStateMachine<AnnotatingStates, AnnotatingTransitions>(
        constantInitialiser(ANNOTATING_TRANSITIONS),
        createNewAnnotatingState("Idle")
    )
}
