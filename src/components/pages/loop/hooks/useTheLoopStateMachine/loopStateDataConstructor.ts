import {LoopStates} from "./LoopStates";
import {
    StateDataConstructor,
    stateDataConstructor
} from "../../../../../util/react/hooks/useStateMachine/stateDataConstructor";

export default function loopStateDataConstructor<State extends keyof LoopStates>(
    state: State
): StateDataConstructor<LoopStates, State> {
    return stateDataConstructor(state)
}
