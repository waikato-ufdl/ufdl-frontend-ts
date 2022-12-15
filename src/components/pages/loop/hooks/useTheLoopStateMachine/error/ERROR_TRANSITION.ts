import {ManualStateTransition} from "../../../../../../util/react/hooks/useStateMachine/types/ManualStateTransition";
import {LoopStates} from "../LoopStates";
import {createErrorState} from "./createErrorState";
import {formatResponseError} from "../../../../../../server/error/formatResponseError";
import {GoodState} from "./goodStates/GoodState";

export const ERROR_TRANSITION: ManualStateTransition<
    LoopStates,
    GoodState,
    [unknown]
>
    = function(this, reason) {
        if (reason instanceof Response) {
            return formatResponseError(reason).then(
                (formatted) => {
                    return ERROR_TRANSITION.call(
                        this,
                        formatted
                    )
                }
            )
        }

        return [
            createErrorState(
                this.data.context,
                reason,
                this
            ),
            (success) => {
                if (!success) {
                    console.error(
                        `Manual error transition was called from Loop-state '${this.state}' but the ` +
                        `state machine had already transitioned`,
                        reason
                    )
                }
            }
        ]
    }
