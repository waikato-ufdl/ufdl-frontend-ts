import {
    StateDataConstructor,
    stateDataConstructor
} from "../../../hooks/useStateMachine/stateDataConstructor";
import {AnnotatingStates} from "./AnnotatingStates";

export default function annotatingStateDataConstructor<State extends keyof AnnotatingStates>(
    state: State
): StateDataConstructor<AnnotatingStates, State> {
    return stateDataConstructor(state)
}
