import useDerivedReducer, {UNINITIALISED} from "./useDerivedReducer";
import {identity} from "../../identity";
import {MultiKeyMap, ReadonlyMultiKeyMap} from "../../typescript/datastructures/MultiKeyMap";
import {all} from "../../typescript/all";

/** The type of function used to derive state for each dependency. */
export type DerivationFunction<D extends readonly unknown[], S>
    = (...dependency: D) => S

function dependencySetInitialiser<D extends readonly unknown[], S>(
    args: [DerivationFunction<D, S>, readonly D[]],
    currentState: [MultiKeyMap<D, S>, DerivationFunction<D, S>] | typeof UNINITIALISED
): [MultiKeyMap<D, S>, DerivationFunction<D, S>] {
    const [deriveState, dependencies] = args
    const [prevMap, prevDeriveState] = currentState === UNINITIALISED
        ? [undefined, UNINITIALISED]
        : currentState

    if (deriveState !== prevDeriveState || prevMap === undefined) {
        return [
            new MultiKeyMap<D, S>(
                dependencies.map(
                    dependency => [dependency, deriveState(...dependency)] as const
                )
            ),
            deriveState
        ]
    }

    const newMap = new MultiKeyMap(prevMap.entries())
    const prevMapHasOtherDependencies = newMap.keep(...dependencies)
    const prevMapHasAllDependencies = all(newMap.has.bind(newMap), ...dependencies)

    if (!prevMapHasOtherDependencies && prevMapHasAllDependencies) return [prevMap, deriveState]

    for (const dependency of dependencies) {
        if (!newMap.has(dependency)) newMap.set(dependency, deriveState(...dependency))
    }

    return [newMap, deriveState]
}

/**
 * Maintains a number of derived states at once, to avoid triggering re-renders
 * when the dependencies only changes order/size, but the unique dependencies don't change.
 *
 * @param deriveState
 *          Function for deriving the state for each dependency. This is assumed to be pure,
 *          so derived results are cached for unique dependencies.
 * @param dependencies
 *          The dependencies to derive state for.
 * @return
 *          A map from each unique dependency to its derived state.
 */
export default function useDerivedStates<D extends readonly unknown[], S>(
    deriveState: DerivationFunction<D, S>,
    dependencies: readonly D[]
): ReadonlyMultiKeyMap<D, S> {

    // Track the set of dependencies
    const [[dependencySet]] = useDerivedReducer<
        [MultiKeyMap<D, S>, DerivationFunction<D, S>],
        never,
        [DerivationFunction<D, S>, readonly D[]]
    >(
        identity,
        dependencySetInitialiser,
        [deriveState, dependencies]
    )

    return dependencySet
}
