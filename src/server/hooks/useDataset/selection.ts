import {DatasetItem} from "../../types/DatasetItem";
import {Dataset} from "../../types/Dataset";
import getRandom from "../../../util/typescript/random/getRandom";
import randomBool from "../../../util/typescript/random/randomBool";
import randomSubset from "../../../util/typescript/random/randomSubset";
import {spreadJoinMaps} from "../../../util/map";
import {DatasetDispatchItemSelector, ItemSelector} from "./types";
import {DatasetDispatchItem} from "./DatasetDispatch";
import {Data} from "../../types/data";
import {UNINITIALISED} from "../../../util/react/hooks/useDerivedReducer";


export const SELECTIONS = {
    ALL() { return true },
    NONE() { return false },
    RANDOM(
        seed?: string
    ): ItemSelector<unknown, unknown> {
        const rand = getRandom(seed)
        return () => randomBool(rand)
    },
    RANDOM_CHOOSE_M(
        m: number,
        seed?: string
    ): ItemSelector<unknown, unknown> {
        let selectorSet: Set<string> | undefined = undefined

        function initSelectorSet(
            dataset: Dataset<DatasetItem<unknown, unknown>>
        ): Set<string> {
            return new Set(
                randomSubset(
                    [...dataset.keys()],
                    BigInt(m),
                    false,
                    false,
                    seed
                )
            )
        }

        return (_, filename, dataset) => {
            if (selectorSet === undefined) selectorSet = initSelectorSet(dataset)
            return selectorSet.has(filename)
        }
    },
    SELECTED(item: DatasetItem<unknown, unknown>) { return item.selected },
    UNSELECTED(item: DatasetItem<unknown, unknown>) { return !item.selected },
    forEval<D extends Data, A, IEval extends DatasetItem<unknown, unknown>>(
        evalDataset: Dataset<IEval>,
        func: (
            item: DatasetDispatchItem<D, A>,
            evalItem?: IEval
        ) => boolean
    ): DatasetDispatchItemSelector<D, A> {
        return (item) => func(item, evalDataset.get(item.filename));
    },
    isFile(filename: string): ItemSelector<Data, unknown> {
        return (item) => item.filename === filename
    },
    inFiles(...filenames: string[]): DatasetDispatchItemSelector<Data, unknown> {
        const fileSet = new Set(filenames);
        return (item) => fileSet.has(item.filename);
    }
} as const;

/**
 * Symbol specifying that the selection state of a dataset-item should
 * be inverted from its current state.
 */
export const TOGGLE: unique symbol = Symbol("Toggles the selection state")

export function selectedReducer(
    prevState: ReadonlyMap<string, boolean>,
    action: [string, boolean | typeof TOGGLE]
): ReadonlyMap<string, boolean> {
    const newState: Map<string, boolean> = spreadJoinMaps(prevState)
    const [filename, newSelectionState] = action

    if (newSelectionState !== TOGGLE) {
        if (prevState.get(filename) === newSelectionState) return prevState
        newState.set(filename, newSelectionState)
    } else if (newState.has(filename)) {
        newState.set(filename, !newState.get(filename))
    } else {
        return prevState
    }

    return newState
}

export function selectedInitialiser(
    args: readonly string[],
    currentState: ReadonlyMap<string, boolean> | typeof UNINITIALISED
): ReadonlyMap<string, boolean> {
    // Create a state where each file is not selected
    const state: Map<string, boolean>
        = new Map(
            args.map(
                (filename) => [
                    filename as string,
                    currentState !== UNINITIALISED && currentState.get(filename) === true
                ] as const
            )
        );

    return state
}