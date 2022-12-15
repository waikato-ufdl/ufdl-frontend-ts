import {LoopStates} from "./LoopStates";
import {trySaveLoopState} from "./save";
import {LoopStateAndData} from "./types/LoopStateAndData";
import {StateDataConstructor} from "../../../../../util/react/hooks/useStateMachine/types/StateDataConstructor";
import {stateDataConstructor} from "../../../../../util/react/hooks/useStateMachine/stateDataConstructor";

export function createNewLoopState<State extends keyof LoopStates>(
    state: State
): StateDataConstructor<LoopStates, State> {
    const constructor = stateDataConstructor(state)
    return (data) => {
        const newState = constructor(data)
        trySaveLoopState(newState as LoopStateAndData) // FIXME: Typescript can't recognise that newState is a LoopStateAndData
        return newState
    }
}
