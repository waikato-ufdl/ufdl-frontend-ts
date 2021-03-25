import {AutomaticStatesTransitions, StatesBase, StatesTransitionsBase} from "./types";
import {AUTOMATIC} from "./AUTOMATIC";

export default function extractAutomaticTransitions<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
>(
    transitions: StatesTransitions
): AutomaticStatesTransitions<States, StatesTransitions> {
    return new Proxy(
        transitions,
        {
            get(target: StatesTransitions, p: PropertyKey): any {
                return target[p as any][AUTOMATIC]
            }
        }
    ) as any;
}
