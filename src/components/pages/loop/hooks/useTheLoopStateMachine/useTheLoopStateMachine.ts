import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import {LoopStates} from "./LoopStates";
import {LOOP_TRANSITIONS, LoopTransitions} from "./LoopTransitions";
import useStateMachine from "../../../../../util/react/hooks/useStateMachine/useStateMachine";
import {useObservable} from "../../../../../util/react/hooks/useObservable";

export default function useTheLoopStateMachine(
    context: UFDLServerContext
) {
    const stateMachine = useStateMachine<LoopStates, LoopTransitions>(
        () => LOOP_TRANSITIONS,
        () => ["Selecting Primary Dataset", {context: context}]
    );

    useObservable<number>(
        stateMachine.state === "Training" ?
            stateMachine.data.progress :
            stateMachine.state === "Evaluating" ?
                stateMachine.data.progress :
                stateMachine.state === "Pre-labelling Images" ?
                    stateMachine.data.progress :
                    undefined
    );

    return stateMachine;
}