import {StateMachineStates} from "./StateMachineStates";
import {StateTransitionAttempt} from "./StateTransitionAttempt";
import {StateAndData} from "./StateAndData";
import {PossiblePromise} from "../../../../typescript/types/promise";

export type ManualStateTransition<
    States extends StateMachineStates,
    AllowedFromStates extends keyof States,
    Args extends readonly unknown[] = readonly unknown[]
> = (this: StateAndData<States, AllowedFromStates>, ...args: Args) => PossiblePromise<StateTransitionAttempt<States>>
