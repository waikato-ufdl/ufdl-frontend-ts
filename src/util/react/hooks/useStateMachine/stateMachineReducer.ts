export default function stateMachineReducer(
    currentReducerState: [any, any],
    transition: {
        transition(currentStateMachineState: any, currentStateMachineData: any): [any, any],
        expectedStateMachineState: any,
        expectedStateMachineData: any
    }
): [any, any] {
    if (
        currentReducerState[0] !== transition.expectedStateMachineState ||
        currentReducerState[1] !== transition.expectedStateMachineData
    ) {
        console.error({
            error: "State machine transition attempted on stale state",
            expectedState: transition.expectedStateMachineState,
            expectedData: transition.expectedStateMachineData,
            actualState: currentReducerState[0],
            actualData: currentReducerState[1]
        });
        return currentReducerState;
    }

    return transition.transition(...currentReducerState);
}
