import {LoopStates} from "./LoopStates";
import createNewState from "../../../../../util/react/hooks/useStateMachine/createNewState";

export function createNewLoopState<State extends keyof LoopStates>(
    state: State,
    data: LoopStates[State]
): readonly [State, LoopStates[State]] {
    return createNewState<LoopStates, State>(
        state,
        data
    );
}