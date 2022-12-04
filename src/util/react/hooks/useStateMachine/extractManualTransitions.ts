import {StateMachineStates} from "./types/StateMachineStates";
import {StateMachineTransitions} from "./types/StateMachineTransitions";
import {ManualStateTransitions} from "./types/ManualStateTransitions";
import extractManualTransitionsForState from "./extractManualTransitionsForState";

export default function extractManualTransitions<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>
>(
    transitions: Transitions
): ManualStateTransitions<States, Transitions> {
    return new Proxy(
        transitions,
        {
            get<State extends keyof States>(
                target: Transitions,
                p: State
            ): ManualStateTransitions<States, Transitions>[State] {
                return extractManualTransitionsForState<States, Transitions, State>(target, p)
            }
        }
    )
}