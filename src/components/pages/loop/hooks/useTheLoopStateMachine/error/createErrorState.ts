import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {createNewLoopState} from "../createNewLoopState";
import {ErrorStateAndData} from "./ErrorStateAndData";
import {GoodState} from "./goodStates/GoodState";
import {LoopStateAndData} from "../types/LoopStateAndData";

export function createErrorState(
    context: UFDLServerContext,
    reason: any,
    lastGoodState?: LoopStateAndData<GoodState>
): ErrorStateAndData {
    return createNewLoopState("Error")(
        {
            context,
            reason,
            lastGoodState
        }
    );
}