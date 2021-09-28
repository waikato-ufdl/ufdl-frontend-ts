import {DatasetItem} from "../../types/DatasetItem";
import {Dataset} from "../../types/Dataset";
import getRandom from "../../../util/typescript/random/getRandom";
import randomBool from "../../../util/typescript/random/randomBool";
import randomSubset from "../../../util/typescript/random/randomSubset";

export type ItemSelector<D, A> = (
    item: DatasetItem<D, A>,
    filename: string,
    dataset: Dataset<D, A>
) => boolean

export const SELECTIONS = {
    ALL() { return true },
    NONE() { return false },
    RANDOM(
        seed?: string
    ): ItemSelector<any, any> {
        const rand = getRandom(seed)
        return () => randomBool(rand)
    },
    RANDOM_CHOOSE_M(
        m: number,
        seed?: string
    ): ItemSelector<any, any> {
        let selectorSet: Set<string> | undefined = undefined

        function initSelectorSet(
            dataset: Dataset<any, any>
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
    SELECTED(item: DatasetItem<any, any>) { return item.selected },
    UNSELECTED(item: DatasetItem<any, any>) { return !item.selected },
    forEval<D, A>(
        evalDataset: Dataset<D, A>,
        func: (
            item: DatasetItem<D, A>,
            evalItem?: DatasetItem<D, A>
        ) => boolean
    ): ItemSelector<D, A> {
        return (item) => func(item, evalDataset.get(item.filename));
    },
    isFile(filename: string): ItemSelector<any, any> {
        return (item) => item.filename === filename
    },
    inFiles(...filenames: string[]): ItemSelector<any, any> {
        const fileSet = new Set(filenames);
        return (item) => fileSet.has(item.filename);
    }
} as const;
