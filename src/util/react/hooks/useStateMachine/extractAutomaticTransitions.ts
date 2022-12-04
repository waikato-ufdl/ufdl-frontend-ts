import {AUTOMATIC} from "./AUTOMATIC";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateMachineTransitions} from "./types/StateMachineTransitions";
import {AutomaticStateTransitions} from "./types/AutomaticStateTransitions";

/**
 * Returns a proxy to the automatic state-transitions of a state-machine.
 *
 * @param transitions
 *          The state-transitions of the state-machine.
 * @return
 *          A proxy to the automatic state-transitions of the given transitions.
 */
export default function extractAutomaticTransitions<
    States extends StateMachineStates,
    StatesTransitions extends StateMachineTransitions<States>
>(
    transitions: StatesTransitions
): AutomaticStateTransitions<States, StatesTransitions> {
    return new Proxy(
        transitions,
        {
            get(target: StatesTransitions, p: PropertyKey): any {
                return target[p][AUTOMATIC]
            }
        }
    ) as unknown as AutomaticStateTransitions<States, StatesTransitions>;
}
