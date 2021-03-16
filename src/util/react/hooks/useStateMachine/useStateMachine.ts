import {useEffect, useReducer} from "react";
import useStateSafe from "../useStateSafe";
import {
    StateMachineDispatch,
    StateDataPairs,
    StatesBase,
    StatesTransitionsBase,
    StateMachineReducerDispatch
} from "./types";
import stateMachineReducer from "./stateMachineReducer";
import useDerivedState from "../useDerivedState";
import {AUTOMATIC} from "./AUTOMATIC";

export default function useStateMachine<
    States extends StatesBase,
    StatesTransitions extends StatesTransitionsBase<States>
>(
    transitionsInit: () => StatesTransitions,
    init: () => StateDataPairs<States>
): StateMachineDispatch<States, StatesTransitions> {

    const [transitions] = useStateSafe(transitionsInit);

    console.log(transitions);

    const reducerStateAndDispatch
        = useReducer<any, any>(
            stateMachineReducer,
            undefined,
            init
        ) as any;

    console.log(reducerStateAndDispatch);

    const currentState = reducerStateAndDispatch[0][0] as keyof States;
    const currentData = reducerStateAndDispatch[0][1] as States[keyof States];
    const internalDispatch = reducerStateAndDispatch[1] as StateMachineReducerDispatch<States>;

    const transitionsForCurrentState = transitions[currentState] as any;

    console.log(transitionsForCurrentState);

    const externalDispatch = useDerivedState(
        (
            [
                transitionsForCurrentState,
                currentState,
                currentData
            ]
        ) => {
            if (AUTOMATIC in transitionsForCurrentState) return {};

            return new Proxy(
                transitionsForCurrentState,
                {
                    get(target: any, p: string): any {
                        return (...args: any): void => {
                            const transitionFunction = target[p];
                            const action = transitionFunction(...args) as any;
                            internalDispatch(
                                {
                                    transition: action,
                                    expectedStateMachineState: currentState,
                                    expectedStateMachineData: currentData
                                }
                            );
                        }
                    }
                }
            )
        },
        [transitionsForCurrentState, currentState, currentData] as const
    );

    useEffect(
        () => {
            if (AUTOMATIC in transitionsForCurrentState) {
                const action = transitionsForCurrentState[AUTOMATIC];

                const promiseOfFutureState = action(currentState, currentData) as Promise<StateDataPairs<States>>;

                promiseOfFutureState.then(
                    (newStateAndData) => {
                        internalDispatch(
                            {
                                transition: () => newStateAndData,
                                expectedStateMachineState: currentState,
                                expectedStateMachineData: currentData
                            }
                        );
                    }
                );
            }
        },
        [transitionsForCurrentState, currentState, currentData, internalDispatch]
    );

    return useDerivedState(
        ([currentState, currentData, externalDispatch]) => {
            return {
                state: currentState,
                data: currentData,
                transitions: externalDispatch
            }
        },
        [currentState, currentData, externalDispatch] as const
    );
}
