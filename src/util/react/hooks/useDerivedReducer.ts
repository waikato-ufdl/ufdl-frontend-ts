import {Dispatch, Reducer} from "react";
import useNonUpdatingState from "./useNonUpdatingState";
import {arrayEqual} from "../../typescript/arrays/arrayEqual";
import useControlledUpdateReducer from "./useControlledUpdateReducer";
import useDerivedState from "./useDerivedState";
import useStateSafe from "./useStateSafe";
import {constantInitialiser} from "../../typescript/initialisers";

/**
 * Helper class which represents the action to re-initialise the derived reducer
 * on a dependencies-change. Only takes the actual state to initialise the reducer to.
 */
class ReInitAction<S> { constructor(public state: S) {} }

/**
 * Whether a given action is the re-initialise action.
 *
 * @param action
 *          The action to check.
 */
function isReInitAction<S>(action: any): action is ReInitAction<S> {
    return action instanceof ReInitAction
}

/**
 * The type of actions a derived reducer can take, given a base reducer
 * with state S and action A.
 */
type ReducerActionOrReInit<S, A> = A | ReInitAction<S>

/**
 * The type of a reducer with the re-initialise action added to its
 * set of actions, A.
 */
type ReducerWithReInit<S, A> = Reducer<S, ReducerActionOrReInit<S, A>>

/**
 * Utility symbol to use as the initial state of a derived reducer when no actual state
 * is provided.
 */
export const UNINITIALISED: unique symbol = Symbol("The state is not yet initialised")

/**
 * Adds a reducer to the component which has state S and takes an action-type A.
 * The reducer will re-initialise whenever the dependencies array changes.
 *
 * @param reducer
 *          The reducer to use. Only read on first call.
 * @param initialiser
 *          The initialiser to use to re-initialise the reducer. Can change from
 *          invocation to invocation. On first initialisation, the UNINITIALISED
 *          symbol will be passed for currentState.
 * @param dependencies
 *          The dependencies array. The reducer will re-initialise if this changes.
 */
export default function useDerivedReducer<S, A, D extends readonly unknown[]>(
    reducer: Reducer<S, A>,
    initialiser: (args: D, currentState: S | typeof UNINITIALISED) => S,
    dependencies: D
): [S, Dispatch<A>];

/**
 * Adds a reducer to the component which has state S and takes an action-type A.
 * The reducer will re-initialise whenever the dependencies array changes.
 *
 * @param reducer
 *          The reducer to use. Only read on first call.
 * @param initialiser
 *          The initialiser to use to re-initialise the reducer. Can change from
 *          invocation to invocation.
 * @param dependencies
 *          The dependencies array. The reducer will re-initialise if this changes.
 * @param initialState
 *          The argument to the currentState parameter of the initialiser on first
 *          initialisation.
 */
export default function useDerivedReducer<S, A, D extends readonly unknown[]>(
    reducer: Reducer<S, A>,
    initialiser: (args: D, currentState: S) => S,
    dependencies: D,
    initialState: () => S
): [S, Dispatch<A>];

/**
 * Adds a reducer to the component which has state S and takes an action-type A.
 * The reducer will re-initialise whenever the dependencies array changes.
 *
 * @param reducer
 *          The reducer to use. Only read on first call.
 * @param initialiser
 *          The initialiser to use to re-initialise the reducer. Can change from
 *          invocation to invocation.
 * @param dependencies
 *          The dependencies array. The reducer will re-initialise if this changes.
 * @param initialState
 *          An optional argument to the currentState parameter of the initialiser.
 */
export default function useDerivedReducer<S, A, D extends readonly unknown[]>(
    reducer: Reducer<S, A>,
    initialiser: (args: D, currentState: S | typeof UNINITIALISED) => S,
    dependencies: D,
    initialState: (() => S) | typeof UNINITIALISED = UNINITIALISED
): [S, Dispatch<A>] {
    // Keep track of the previous state of our dependencies. No need to render when this changes.
    const [getLastDependencies, setLastDependencies] = useNonUpdatingState<D>(constantInitialiser(dependencies));

    // Create a reducer which can also be re-initialised when necessary
    const [reducerExtended] = useStateSafe<ReducerWithReInit<S, A>>(
        () => (currentState, action) => {
            if (isReInitAction(action)) {
                return action.state;
            } else {
                return reducer(currentState, action);
            }
        }
    );

    // Add update-control to the reducer
    const [reducerState, dispatch] = useControlledUpdateReducer<S, ReducerActionOrReInit<S, A>>(
        reducerExtended,
        () => initialiser(dependencies, initialState === UNINITIALISED ? UNINITIALISED : initialState())
    );

    // Create a dispatch function which always re-renders
    const exposedDispatch = useDerivedState(
        ([dispatch]) => (action: A) => dispatch(action, true),
        [dispatch] as const
    );

    // If the dependencies have changed, re-initialise
    let derivedState: S;
    if (!arrayEqual(getLastDependencies(), dependencies)) {
        derivedState = initialiser(dependencies, reducerState);
        dispatch(new ReInitAction(derivedState), false);
        setLastDependencies(dependencies);

    // Otherwise re-use the saved state
    } else {
        derivedState = reducerState;
    }

    return [derivedState, exposedDispatch];
}