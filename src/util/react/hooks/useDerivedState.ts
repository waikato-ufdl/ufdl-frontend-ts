import useNonUpdatingState from "./useNonUpdatingState";
import {arrayEqual} from "../../typescript/arrays/arrayEqual";

/**
 * State which updates whenever it's list of dependencies changes.
 *
 * @param deriveState
 *          Function which derives the state from the deriving-dependencies.
 * @param dependencies
 *          The list of dependencies to monitor for changes.
 */
export default function useDerivedState<S, DD extends readonly any[]>(
    deriveState: (dependencies: DD) => S,
    dependencies: DD
): S;

/**
 * State which updates whenever it's list of dependencies changes.
 *
 * @param deriveState
 *          Function which derives the state from the deriving-dependencies.
 * @param dependencies
 *          The list of dependencies to monitor for changes.
 * @param nonDerivationDependencies
 *          Optional dependencies which aren't used in the derivation of the state.
 */
export default function useDerivedState<S, DD extends readonly any[], NDD extends readonly any[]>(
    deriveState: (dependencies: DD) => S,
    dependencies: DD,
    nonDerivationDependencies: NDD
): S;


export default function useDerivedState<S, DD extends readonly any[]>(
    deriveState: (dependencies: DD) => S,
    dependencies: DD,
    nonDerivationDependencies: any[] = []
): S {
    const joinDependencies = () => [dependencies, nonDerivationDependencies];

    const [getLastDependencies, setLastDependencies]
        = useNonUpdatingState(joinDependencies);

    const [lastDependencies, lastNonDerivationDependencies] = getLastDependencies()

    const [getLastDerivedState, setLastDerivedState] = useNonUpdatingState(
        () => deriveState(dependencies)
    );

    let derivedState: S = getLastDerivedState();

    if (
        !arrayEqual(lastDependencies, dependencies) ||
        !arrayEqual(lastNonDerivationDependencies, nonDerivationDependencies)
    ) {
        derivedState = deriveState(dependencies);

        setLastDependencies(joinDependencies());
        setLastDerivedState(derivedState);
    }

    return derivedState
}
