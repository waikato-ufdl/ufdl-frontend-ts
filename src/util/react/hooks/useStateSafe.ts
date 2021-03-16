import {Dispatch, useReducer} from "react";
import {createSimpleStateReducer} from "./SimpleStateReducer";

/**
 * React's useState is unsafe in that it can't tell whether a value
 * or an initialiser is being passed when S is a function type. This
 * ensures that only initialisers are passed, so if S is a function type,
 * it can't be passed as a value and then called as an initialiser.
 *
 * @param initialiser
 *          Sets the initial value of the state.
 */
export default function useStateSafe<S>(
    initialiser: () => S
): [S, Dispatch<S>] {
    return useReducer(createSimpleStateReducer<S>(), null, initialiser);
}
