import {Dispatch} from "react";
import {AUTOMATIC} from "./AUTOMATIC";

export type StatesBase = { readonly [state in PropertyKey]: any }

export type StateDataPairs<
    States extends StatesBase,
    SelectedStates extends keyof States = keyof States
> = SelectedStates extends SelectedStates ?
    readonly [SelectedStates, States[SelectedStates]] :
    never;

export type StatesTransitionsBase<
    States extends StatesBase
> = {
    readonly [state in keyof States]:
    | {
        readonly [transition: string]: (...args: any[]) => (...currentStateAndData: StateDataPairs<States, state>) => StateDataPairs<States>
    }
    | {
        readonly [AUTOMATIC]: (...currentStateAndData: StateDataPairs<States, state>) => Promise<StateDataPairs<States>>
        readonly [transition: string]: undefined
    }
}

export type StatesTransitionsDispatch<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
> = {
    readonly [state in keyof States]: StatesTransitions[state] extends { readonly [AUTOMATIC]: any } ?
        {} :
        { readonly [transition in keyof StatesTransitions[state]]: (...args: Parameters<StatesTransitions[state][transition]>) => void }
}

export type StateMachineDispatch<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
> = {
    readonly [state in keyof States]: {
        state: state,
        data: States[state],
        transitions: StatesTransitionsDispatch<States, StatesTransitions>[state]
    }
}[keyof States]

export type StateMachineReducerDispatch<
    States extends StatesBase
> = Dispatch<
    {
        transition: (...currentStateAndData: StateDataPairs<States>) => StateDataPairs<States>
        expectedStateMachineState: keyof States
        expectedStateMachineData: States[keyof States]
    }
>
