import {StateMachineStates} from "./types/StateMachineStates";
import {StateMachineTransitions} from "./types/StateMachineTransitions";
import {ManualStateTransitions} from "./types/ManualStateTransitions";
import {AUTOMATIC} from "./AUTOMATIC";
import UNREACHABLE from "../../../typescript/UNREACHABLE";

export default function extractManualTransitionsForState<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>,
    State extends keyof States
>(
    transitions: Transitions,
    state: State
): ManualStateTransitions<States, Transitions>[State] {
    return new Proxy(
        transitions[state],
        {
            get(
                target: Transitions[State],
                p: string | symbol
            ): ManualStateTransitions<States, Transitions>[State][keyof ManualStateTransitions<States, Transitions>[State]] {
                // Hide the automatic transition
                if (p === AUTOMATIC) UNREACHABLE("External type signature prohibits this case");

                return target[
                    p as keyof ManualStateTransitions<States, Transitions>[State] // The external interface ensures this type assertion
                ]
            }
        }
    )
}
