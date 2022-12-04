import {StateTransitionsDispatch} from "./types/StateTransitionsDispatch";
import {StateMachineStates} from "./types/StateMachineStates";
import {StateMachineTransitions} from "./types/StateMachineTransitions";
import extractManualTransitionsForState from "./extractManualTransitionsForState";
import {Dispatch} from "react";
import {StateMachineReducerAction} from "./types/StateMachineReducerAction";
import {StateAndData} from "./types/StateAndData";
import createStateTransitionAction from "./createStateTransitionAction";
import {ManualStateTransitions} from "./types/ManualStateTransitions";
import {ManualStateTransition} from "./types/ManualStateTransition";

export default function createStateTransitionsDispatch<
    States extends StateMachineStates,
    Transitions extends StateMachineTransitions<States>,
    State extends keyof States
>(
    transitions: Transitions,
    creationTimeStateAndData: StateAndData<States, State>,
    dispatch: Dispatch<StateMachineReducerAction<States>>
): StateTransitionsDispatch<States, Transitions>[State] {
    const manualTransitionsForState = extractManualTransitionsForState<States, Transitions, State>(transitions, creationTimeStateAndData.state)

    return new Proxy(
        manualTransitionsForState,
        {
            get<Transition extends keyof ManualStateTransitions<States, Transitions>[State] & string>(
                target: ManualStateTransitions<States, Transitions>[State],
                p: string | symbol
            ): StateTransitionsDispatch<States, Transitions>[State][Transition] | undefined
            {
                const manualTransitionName = p as Transition // External type signature ensures this cast

                // Get the requested manual transition function and bind it to the current state/data
                const manualTransition = target[manualTransitionName]

                return function (...args) {
                    dispatch(
                        createStateTransitionAction(
                            creationTimeStateAndData,
                            () => (manualTransition as ManualStateTransition<States, State, Parameters<OmitThisParameter<typeof manualTransition>>>).call(creationTimeStateAndData, ...args),
                            manualTransitionName
                        )
                    )
                }
            }
        }
    ) as unknown as StateTransitionsDispatch<States, Transitions>[State]
}