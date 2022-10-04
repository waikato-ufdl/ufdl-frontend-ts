import useStateMachine from "../../../hooks/useStateMachine/useStateMachine";
import {StateMachineDispatch} from "../../../hooks/useStateMachine/types";
import {constantInitialiser} from "../../../../typescript/initialisers";
import {AnnotatingStates} from "./AnnotatingStates";
import {ANNOTATING_TRANSITIONS, AnnotatingTransitions} from "./AnnotatingTransitions";

export default function useAnnotatingStateMachine(
): StateMachineDispatch<AnnotatingStates, AnnotatingTransitions> {
    return useStateMachine<AnnotatingStates, AnnotatingTransitions>(
        constantInitialiser(ANNOTATING_TRANSITIONS),
        () => {
            return {
                state: "Idle",
                data: {
                    selectedShapeIndex: undefined
                }
            }
        }
    );
}
