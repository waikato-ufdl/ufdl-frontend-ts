import {StateDataConstructor} from "../../../hooks/useStateMachine/stateDataConstructor";
import {AnnotatingStates} from "./AnnotatingStates";
import annotatingStateDataConstructor from "./annotatingStateDataConstructor";


export function createNewAnnotatingState<State extends keyof AnnotatingStates>(
    state: State
): StateDataConstructor<AnnotatingStates, State> {
    const constructor = annotatingStateDataConstructor(state)
    return (data) => {
        return constructor(data)
    }
}
