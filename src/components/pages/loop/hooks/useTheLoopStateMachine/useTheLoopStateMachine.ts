import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {LoopStates} from "./LoopStates";
import {LOOP_TRANSITIONS, LoopTransitions} from "./LoopTransitions";
import useStateMachine from "../../../../../util/react/hooks/useStateMachine/useStateMachine";
import {StateMachineDispatch} from "../../../../../util/react/hooks/useStateMachine/types";
import {constantInitialiser} from "../../../../../util/typescript/initialisers";

export default function useTheLoopStateMachine(
    context: UFDLServerContext
): StateMachineDispatch<LoopStates, LoopTransitions> {
    return useStateMachine<LoopStates, LoopTransitions>(
        constantInitialiser(LOOP_TRANSITIONS),
        () => {
            return {
                state: "Initial",
                data: {context, agreed: false}
            }
        }
    );
}
