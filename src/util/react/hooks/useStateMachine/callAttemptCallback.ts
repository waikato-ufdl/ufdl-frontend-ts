import {StateTransitionAttempt} from "./types/StateTransitionAttempt";
import {StateMachineStates} from "./types/StateMachineStates";
import isPromise from "../../../typescript/async/isPromise";
import {isArray} from "../../../typescript/arrays/isArray";
import pass from "../../../typescript/functions/pass";
import {PossiblePromise} from "../../../typescript/types/promise";

/**
 * Calls the callback for a transition attempt, if it has one.
 *
 * @param attempt
 *          The transition-attempt to inform of transition success/failure.
 * @param success
 *          Whether the attempt was successful.
 */
export default function callAttemptCallback<
    States extends StateMachineStates
>(
    attempt: PossiblePromise<StateTransitionAttempt<States>>,
    success: boolean
): void {
    // If the attempt is not made, there is no callback
    if (attempt === undefined) return

    // If the attempt isn't ready yet, schedule the callback for when it is
    if (isPromise(attempt)) {
        attempt.then(
            result => callAttemptCallback(result, success)
        )
    }

    const [, callback] = isArray(attempt) ? attempt : [attempt, pass]

    try {
        callback(success)
    } catch (e) {
        console.error("Error occurred in state transition-attempt callback", e)
    }
}