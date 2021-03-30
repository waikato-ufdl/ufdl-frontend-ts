import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {LoopStates} from "./LoopStates";
import {LOOP_TRANSITIONS, LoopTransitions} from "./LoopTransitions";
import useStateMachine from "../../../../../util/react/hooks/useStateMachine/useStateMachine";
import {useObservable} from "../../../../../util/react/hooks/useObservable";
import {StateMachineDispatch} from "../../../../../util/react/hooks/useStateMachine/types";
import {constantInitialiser} from "../../../../../util/typescript/initialisers";

export default function useTheLoopStateMachine(
    context: UFDLServerContext
): StateMachineDispatch<LoopStates, LoopTransitions> {
    const stateMachine = useStateMachine<LoopStates, LoopTransitions>(
        constantInitialiser(LOOP_TRANSITIONS),
        () => {
            return {
                state: "Selecting Primary Dataset",
                data: {context: context}
            }
        }
    );

    useObservable<number>(
        stateMachine.state === "Training" ?
            stateMachine.data.progress :
            stateMachine.state === "Evaluating" ?
                stateMachine.data.progress :
                stateMachine.state === "Prelabel" ?
                    stateMachine.data.progress :
                    undefined
    );

    return stateMachine;
}