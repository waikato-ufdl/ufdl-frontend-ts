import {useReducer} from "react";
import {identity} from "../../identity";

/**
 * Hook which provides a callback which can be used to trigger a React
 * render.
 */
export default function useUpdateTrigger(): () => void {
    // A reducer which updates its state to a new empty array each time
    // the dispatch is called. React sees the new array as new state, so
    // triggers a render
    return useReducer(
        () => [],
        [],
        identity
    )[1];
}
