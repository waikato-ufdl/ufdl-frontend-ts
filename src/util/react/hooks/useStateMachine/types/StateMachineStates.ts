/**
 * The base-type of the states of a state-machine. The keys are the
 * state labels and the values are the parameterised data of the
 * respective states.
 */
export type StateMachineStates = {
    [state: PropertyKey]: any
}
