import {Dispatch} from "react";
import useStateSafe from "./useStateSafe";
import {constantInitialiser} from "../../typescript/initialisers";

export type StateAccessor<S> = () => S

function createStaticStateClosure<S>(
    init: () => S
): [StateAccessor<S>, Dispatch<S>] {
    let closureState: S = init();

    function getClosureState(): S {
        return closureState;
    }

    function setClosureState(value: S) {
        closureState = value;
    }

    return [getClosureState, setClosureState];
}

/**
 * Creates a  static accessor function which returns the current
 * value of some other piece of state, so the state can be passed
 * around without triggering renders.
 *
 * @param state
 *          The value of the state.
 */
export default function useStaticStateAccessor<S>(
    state: S
): StateAccessor<S> {

    const [getClosureState, setClosureState] = useStateSafe(
        () => createStaticStateClosure(constantInitialiser(state))
    )[0];

    setClosureState(state);

    return getClosureState;
}
