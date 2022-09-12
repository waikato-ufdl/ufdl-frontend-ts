import {AUTOMATIC} from "./AUTOMATIC";
import {Dispatch, Reducer} from "react";
import {PossiblePromise} from "../../../typescript/types/promise";

export type StatesBase = { [stateName: string]: any }

export type ValidStateNames<K extends PropertyKey> =
    K extends string?
        K
        : never

export type ValidStates<T extends StatesBase> = {
    [K in ValidStateNames<keyof T>]: T[K]
}

export type StateAndData<
    States extends StatesBase,
    SelectedStates extends keyof ValidStates<States> = keyof ValidStates<States>
> = {
    [StateName in SelectedStates]: {
        state: StateName,
        data: States[StateName]
    }
}[SelectedStates]

export type StateTransition<
    States extends StatesBase
> = (current: StateAndData<States>) => (PossiblePromise<StateAndData<States>> | void)

export type ManualStateTransition<
    States extends StatesBase
> = (...args: any) => StateTransition<States>

export type AutomaticStateTransition<
    States extends StatesBase,
    AllowedFromStates extends keyof ValidStates<States> = keyof ValidStates<States>
> = (
    current: StateAndData<States, AllowedFromStates>,
    changeState: Dispatch<StateTransition<States>>
) => void

export type StatesTransitionsBase<
    States extends StatesBase
> = {
    readonly [StateName in keyof ValidStates<States>]: {
        readonly [transition: string]: ManualStateTransition<States>
        readonly [AUTOMATIC]?: AutomaticStateTransition<States, StateName>
    }
}

export type AutomaticStatesTransitions<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
> = {
    readonly [StateName in keyof ValidStates<States>]: StatesTransitions[StateName][typeof AUTOMATIC]
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
    readonly [StateName in keyof ValidStates<States>]: {
        readonly [Transition in Exclude<keyof StatesTransitions[StateName], typeof AUTOMATIC>]: (
            ...args: Parameters<StatesTransitions[StateName][Transition]>
        ) => void
    }
}

export type StateMachineDispatch<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>,
    SelectedStates extends keyof ValidStates<States> = keyof ValidStates<States>
> = {
    readonly [StateName in SelectedStates]: {
        state: StateName,
        data: States[StateName],
        transitions: StatesTransitionsDispatch<States, StatesTransitions>[StateName]
    }
}[SelectedStates]
