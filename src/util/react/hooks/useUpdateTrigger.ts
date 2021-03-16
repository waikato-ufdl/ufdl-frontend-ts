import {useReducer} from "react";
import {identity} from "../../identity";

export default function useUpdateTrigger(): () => void {
    return useReducer(
        (currentState: boolean) => !currentState,
        false,
        identity
    )[1];
}