import {AUTOMATIC} from "./AUTOMATIC";
import {Dispatch, Reducer} from "react";
import {PossiblePromise} from "../../../typescript/types/promise";

export type StatesBase = { readonly [state in PropertyKey]: any }

export type StateAndData<
    States extends StatesBase,
    SelectedStates extends keyof States = keyof States
> = SelectedStates extends SelectedStates ?
    {
        readonly state: SelectedStates
        readonly data: States[SelectedStates]
    } :
    never;

export type StateTransition<
    States extends StatesBase
> = (current: StateAndData<States>) => (PossiblePromise<StateAndData<States>> | void)

export type ManualStateTransition<
    States extends StatesBase
> = (...args: any) => StateTransition<States>

export type AutomaticStateTransition<
    States extends StatesBase,
    AllowedFromStates extends keyof States = keyof States
> = (
    current: StateAndData<States, AllowedFromStates>,
    changeState: Dispatch<StateTransition<States>>
) => void

export type StatesTransitionsBase<
    States extends StatesBase
> = {
    readonly [state in keyof States]: {
        readonly [transition: string]: ManualStateTransition<States>
        readonly [AUTOMATIC]?: AutomaticStateTransition<States, state>
    }
}

export type AutomaticStatesTransitions<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
> = {
    readonly [state in keyof States]: StatesTransitions[state][typeof AUTOMATIC]
}

export type StateMachineReducerState<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
> = {
    state: StateAndData<States>,
    [AUTOMATIC]: AutomaticStatesTransitions<States, StatesTransitions>,
    dispatch: Dispatch<StateTransition<States>>
}

export type StateMachineReducer<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
> = Reducer<
        StateMachineReducerState<States, StatesTransitions>,
        StateTransition<States>
    >

export type StatesTransitionsDispatch<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
> = {
    readonly [state in keyof States]: {
        readonly [transition in Exclude<keyof StatesTransitions[state], typeof AUTOMATIC>]: (
            ...args: Parameters<StatesTransitions[state][transition]>
        ) => void
    }
}

export type StateMachineDispatch<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>,
    SelectedStates extends keyof States = keyof States
> = {
    readonly [state in keyof States]: {
        state: state,
        data: States[state],
        transitions: StatesTransitionsDispatch<States, StatesTransitions>[state]
    }
}[SelectedStates]
