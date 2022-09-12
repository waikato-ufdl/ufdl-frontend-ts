import {LoopStates} from "./LoopStates";
import {trySaveLoopState} from "./save";
import loopStateDataConstructor from "./loopStateDataConstructor";
import {StateDataConstructor} from "../../../../../util/react/hooks/useStateMachine/stateDataConstructor";
import {LoopStateAndData} from "./types";

export function createNewLoopState<State extends keyof LoopStates>(
    state: State
): StateDataConstructor<LoopStates, State> {
    const constructor = loopStateDataConstructor(state)
    return (data) => {
        const newState = constructor(data)
        trySaveLoopState(newState as LoopStateAndData) // FIXME: Typescript can't recognise that newState is a LoopStateAndData
        return newState
    }
}
