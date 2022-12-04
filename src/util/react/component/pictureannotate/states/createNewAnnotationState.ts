import {AnnotatingStates} from "./AnnotatingStates";
import {StateDataConstructor} from "../../../hooks/useStateMachine/types/StateDataConstructor";
import {stateDataConstructor} from "../../../hooks/useStateMachine/stateDataConstructor";


export function createNewAnnotatingState<State extends keyof AnnotatingStates>(
    state: State
): StateDataConstructor<AnnotatingStates, State> {
    return stateDataConstructor(state)
}
