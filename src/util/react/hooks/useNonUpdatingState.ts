import {Dispatch} from "react";
import useStateSafe from "./useStateSafe";

function createNonUpdatingStateClosure<S>(
    init: () => S
): [() => S, Dispatch<S>] {
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
 * State which does not cause a re-render when it is updated.
 *
 * @param init
 *          Sets the initial value of the state.
 */
export default function useNonUpdatingState<S>(
    init: () => S
): [() => S, Dispatch<S>] {

    const [getClosureState, setClosureState] = useStateSafe(
        () => createNonUpdatingStateClosure(init)
    )[0];

    return [getClosureState, setClosureState];
}
