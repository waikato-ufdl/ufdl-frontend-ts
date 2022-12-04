import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {createNewLoopState} from "../createNewLoopState";
import {ErrorStateAndData} from "./ErrorStateAndData";

export function createErrorState(
    context: UFDLServerContext,
    reason: any
): ErrorStateAndData {
    return createNewLoopState("Error")(
        {
            context: context,
            reason: reason
        }
    );
}