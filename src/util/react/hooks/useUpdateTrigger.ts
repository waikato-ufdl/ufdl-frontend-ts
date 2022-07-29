import {useReducer} from "react";
import {identity} from "../../identity";

export default function useUpdateTrigger(): () => void {
    return useReducer(
        () => [],
        [],
        identity
    )[1];
}