import {StatesBase} from "./types";

export default function createNewState<
    States extends StatesBase,
    State extends keyof States
> (
    state: State,
    data: States[State]
): readonly [State, States[State]] {
    return [state, data] as const;
}
