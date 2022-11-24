import {createNewLoopState} from "./createNewLoopState";
import {formatResponseError, handleErrorResponse} from "../../../../../server/util/responseError";
import {StateAndData} from "../../../../../util/react/hooks/useStateMachine/types";
import {LoopStates} from "./LoopStates";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {LoopStateAndData, LoopStateTransition} from "./types";
import {Dispatch} from "react";

export type ErrorStateAndData = StateAndData<LoopStates, "Error">

export const HANDLED_ERROR_RESPONSE = Symbol("The expected value cannot be returned because a response error occurred");

export function createErrorState(
    context: UFDLServerContext,
    reason: any,
    prelabelMode: "None" | "Single" | "Multi" | "Default"
): ErrorStateAndData {
    return createNewLoopState("Error")(
        {
            context,
            reason,
            prelabelMode
        }
    );
}

export function createErrorStateTransition(
    current: LoopStateAndData,
    reason: any
): LoopStateTransition {
    return (newCurrent) => {
        console.error("Encountered error response in state transition", reason);
        if (newCurrent === current) {
            return createErrorState(current.data.context, reason, current.data.prelabelMode);
        } else {
            return undefined;
        }
    }
}

export function tryTransitionToErrorState(
    current: LoopStateAndData,
    changeState: Dispatch<LoopStateTransition>,
    reason: any
): void {
    changeState(createErrorStateTransition(current, reason));
}

export function errorResponseTransition(
    current: LoopStateAndData,
    changeState: Dispatch<LoopStateTransition>,
): (response: Response) => Promise<typeof HANDLED_ERROR_RESPONSE> {
    return async (response) => {
        const reason = await formatResponseError(response);
        tryTransitionToErrorState(current, changeState, reason);
        return HANDLED_ERROR_RESPONSE;
    };
}

export function createErrorResponseTransitionHandler(
    current: LoopStateAndData,
    changeState: Dispatch<LoopStateTransition>
): <T>(promise: Promise<T>) => Promise<T | typeof HANDLED_ERROR_RESPONSE> {
    return (promise) => {
        return handleErrorResponse(
            promise,
            errorResponseTransition(current, changeState)
        )
    }
}
