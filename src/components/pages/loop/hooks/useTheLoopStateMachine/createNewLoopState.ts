import {LoopStates} from "./LoopStates";
import createNewState from "../../../../../util/react/hooks/useStateMachine/createNewState";
import {StateAndData} from "../../../../../util/react/hooks/useStateMachine/types";

export function createNewLoopState<State extends keyof LoopStates>(
    state: State,
    data: LoopStates[State]
): StateAndData<LoopStates, State> {
    return createNewState<LoopStates, State>(
        state,
        data
    );
}
