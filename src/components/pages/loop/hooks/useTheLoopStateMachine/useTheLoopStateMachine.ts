import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {LoopStates} from "./LoopStates";
import {LOOP_TRANSITIONS, LoopTransitions} from "./LoopTransitions";
import useStateMachine from "../../../../../util/react/hooks/useStateMachine/useStateMachine";
import {constantInitialiser} from "../../../../../util/typescript/initialisers";
import {StateMachineDispatch} from "../../../../../util/react/hooks/useStateMachine/types/StateMachineDispatch";
import {StateAndData} from "../../../../../util/react/hooks/useStateMachine/types/StateAndData";
import {AUTOMATIC} from "../../../../../util/react/hooks/useStateMachine/AUTOMATIC";
import {createErrorState} from "./error/createErrorState";
import {anyToString} from "../../../../../util/typescript/strings/anyToString";
import {formatResponseError} from "../../../../../server/error/formatResponseError";
import {CANCELLED} from "../../../../../server/jobs/observeJobTransitionsViaWebSocket";
import {silentlyCancelJob} from "./silentlyCancelJob";

export default function useTheLoopStateMachine(
    context: UFDLServerContext
): StateMachineDispatch<LoopStates, LoopTransitions> {
    return useStateMachine<LoopStates, LoopTransitions>(
        constantInitialiser(LOOP_TRANSITIONS),
        () => {
            return {
                state: "Initial",
                data: {context: context}
            }
        },
        (
            stateAndData: StateAndData<LoopStates>,
            transition: string | typeof AUTOMATIC,
            reason: any
        ) => {
            if (reason === CANCELLED) return

            if ("jobPK" in stateAndData.data) {
                silentlyCancelJob(stateAndData.data.context, stateAndData.data.jobPK)
            }

            function formatReason(reason: string): string {
                return `Error occurred in transition '${transition === AUTOMATIC ? "[AUTOMATIC]" : transition}' of` +
                    `state '${stateAndData.state}':\n${reason}`
            }

            const formattedReason = reason instanceof Response
                ? formatResponseError(reason).then(formatReason)
                : formatReason(anyToString(reason))

            return createErrorState(
                stateAndData.data.context,
                formattedReason,
                "lastGoodState" in stateAndData.data
                    ? stateAndData.data.lastGoodState
                    : undefined
            )
        }
    );
}
