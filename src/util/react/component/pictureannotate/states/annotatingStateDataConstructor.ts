import {
    stateDataConstructor
} from "../../../hooks/useStateMachine/stateDataConstructor";
import {AnnotatingStates} from "./AnnotatingStates";
import {StateDataConstructor} from "../../../hooks/useStateMachine/types/StateDataConstructor";

export default function annotatingStateDataConstructor<State extends keyof AnnotatingStates>(
    state: State
): StateDataConstructor<AnnotatingStates, State> {
    return stateDataConstructor(state)
}
