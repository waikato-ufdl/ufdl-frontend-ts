import {createNewLoopState} from "./createNewLoopState";
import {formatResponseError} from "../../../../../server/util/responseError";
import {StateDataPairs} from "../../../../../util/react/hooks/useStateMachine/types";
import {LoopStates} from "./LoopStates";
import UFDLServerContext from "ufdl-js-client/UFDLServerContext";

export type ErrorStateDataPair = StateDataPairs<LoopStates, "Error">

export function createErrorState(
    context: UFDLServerContext,
    reason: any
): ErrorStateDataPair {
    return createNewLoopState(
        "Error",
        {
            context: context,
            reason: reason
        }
    );
}

export function errorTransition(
    reason: any
): (_state: keyof LoopStates, data: {context: UFDLServerContext}) => ErrorStateDataPair {
    return (_state: keyof LoopStates, data: {context: UFDLServerContext}) => createErrorState(data.context, reason);
}

export function errorResponseTransition(
    context: UFDLServerContext
): (response: Response) => Promise<ErrorStateDataPair> {
    return async (response) => createErrorState(context, await formatResponseError(response));
}
