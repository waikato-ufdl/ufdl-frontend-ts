import {StateMachineStates} from "./StateMachineStates";
import {StateAndData} from "./StateAndData";

/**
 * The type of function which constructs the data for a given state.
 */
export type StateDataConstructor<
    States extends StateMachineStates,
    State extends keyof States
> = {
    [StateName in State]: (data: States[StateName]) => StateAndData<States, StateName>
}[State]
